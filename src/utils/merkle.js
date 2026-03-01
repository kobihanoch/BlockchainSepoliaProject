import { keccak256, solidityPacked, getAddress } from "ethers";

export const normalizeAddress = (addr) => getAddress(addr);

const hashLeaf = (addr) =>
  keccak256(solidityPacked(["address"], [normalizeAddress(addr)]));

const hashPair = (a, b) => {
  const left = a.toLowerCase() <= b.toLowerCase() ? a : b;
  const right = left === a ? b : a;
  return keccak256(solidityPacked(["bytes32", "bytes32"], [left, right]));
};

export const buildTree = (addresses) => {
  const leaves = addresses.map(hashLeaf); // Hash all addresses
  const layers = [leaves]; // All layers of tree (currently only the last layer which is all the addresses)
  while (layers[layers.length - 1].length > 1) {
    // While current layer has more than one item (not root)
    const current = layers[layers.length - 1]; // Current layer
    const next = [];
    // Build next layer
    for (let i = 0; i < current.length; i += 2) {
      // Get each pair's left and right
      const left = current[i];
      const right = current[i + 1] || current[i];
      // Hash current pair
      next.push(hashPair(left, right));
    }
    layers.push(next); // Add new layer to tree
  }
  return { leaves, layers };
};

export const getMerkleRoot = (addresses) => {
  if (!addresses.length) return "0x" + "0".repeat(64);
  const { layers } = buildTree(addresses);
  return layers[layers.length - 1][0]; // Merkle root
};

export const getProof = (addresses, addr) => {
  if (!addresses.length) return [];
  const normalized = addresses.map(normalizeAddress);
  const target = normalizeAddress(addr);
  // Find index inside allow list
  const index = normalized.findIndex(
    (item) => item.toLowerCase() === target.toLowerCase(),
  );
  if (index === -1) return []; // If not found
  const { layers } = buildTree(normalized); // Get tree, 0 is leaves last is root
  let idx = index;
  const proof = [];
  for (let level = 0; level < layers.length - 1; level += 1) {
    const layer = layers[level];
    const pairIndex = idx % 2 === 0 ? idx + 1 : idx - 1; // If index is even my pair is +1 else my pair is -1
    const sibling = layer[pairIndex] || layer[idx]; // If there is not sibling duplicate current
    proof.push(sibling);
    idx = Math.floor(idx / 2); // Go to upper layer
  }
  return proof; // Returns array of sibling's hashes through the tree
};

// Only for UI
export const isAllowed = (addresses, addr) => {
  try {
    const target = normalizeAddress(addr);
    return addresses.some(
      (item) => normalizeAddress(item).toLowerCase() === target.toLowerCase(),
    );
  } catch (error) {
    return false;
  }
};

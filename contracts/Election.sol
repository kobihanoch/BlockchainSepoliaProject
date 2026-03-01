pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract Election is ERC20 {
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
        uint8[3] answers;
    }

    mapping(uint => Candidate) public candidates;
    uint public candidatesCount;
    mapping(address => bool) public hasVoted;
    uint public votingStart;
    uint public votingEnd;
    address public admin;
    bytes32 public merkleRoot;

    event VotedEvent(uint indexed candidateId, address indexed voter);
    event CandidateAdded(uint candidateId, string name);
    event VotingTimesSet(uint startTime, uint endTime);
    event MerkleRootSet(bytes32 root);

    constructor() ERC20("ElectionToken", "BAL") {
        admin = msg.sender;
        _mint(address(this), 1000000 * 10 ** decimals());
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyDuringElection() {
        require(votingStart > 0 && votingEnd > 0, "Election times not set");
        require(block.timestamp >= votingStart, "Election has not started yet");
        require(block.timestamp <= votingEnd, "Election has ended");
        _;
    }

    function addCandidate(string memory name, uint8[3] memory answers) public onlyAdmin {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, name, 0, answers);
        emit CandidateAdded(candidatesCount, name);
    }

    function setVotingTimes(uint startTime, uint endTime) public onlyAdmin {
        require(endTime > startTime, "Invalid time window");
        votingStart = startTime;
        votingEnd = endTime;
        emit VotingTimesSet(startTime, endTime);
    }

    function setMerkleRoot(bytes32 root) public onlyAdmin {
        merkleRoot = root;
        emit MerkleRootSet(root);
    }

    function vote(uint candidateId, bytes32[] calldata proof) public onlyDuringElection {
        require(!hasVoted[msg.sender], "You have already voted");
        require(candidateId > 0 && candidateId <= candidatesCount, "Invalid candidate ID");
        require(merkleRoot != bytes32(0), "Merkle root not set");

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(proof, merkleRoot, leaf), "Invalid proof");

        hasVoted[msg.sender] = true;
        candidates[candidateId].voteCount++;

        uint rewardAmount = 10 * 10 ** decimals();
        _transfer(address(this), msg.sender, rewardAmount);

        emit VotedEvent(candidateId, msg.sender);
    }

    function getCandidate(uint id) public view returns (uint, string memory, uint, uint8[3] memory) {
        Candidate memory c = candidates[id];
        return (c.id, c.name, c.voteCount, c.answers);
    }
}

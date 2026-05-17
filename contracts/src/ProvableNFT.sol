// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ProvableNFT
 * @notice Soulbound Reputation NFT on Arc Network
 * @dev Wallet scoring + sybil detection → mint non-transferable NFT badge
 */
contract ProvableNFT is ERC721, Ownable {
    struct Score {
        uint8 totalScore;      // 0-100
        uint8 tier;            // 0=Bronze, 1=Silver, 2=Gold, 3=Platinum, 4=Diamond
        uint32 timestamp;
        string metadataURI;
    }

    mapping(address => Score) public scores;
    mapping(address => uint256) public tokenIds;
    uint256 private _tokenIdCounter;

    event ScoreMinted(address indexed wallet, uint256 tokenId, uint8 score, uint8 tier);
    event ScoreUpdated(address indexed wallet, uint8 oldScore, uint8 newScore, uint8 newTier);

    constructor() ERC721("ProveArc Reputation", "PROVEARC") {}

    function mintScore(
        address wallet,
        uint8 score,
        uint8 tier,
        string memory metadataURI
    ) external onlyOwner {
        require(score <= 100, "Invalid score");
        require(tier <= 4, "Invalid tier");
        require(wallet != address(0), "Invalid address");

        uint8 oldScore = scores[wallet].totalScore;

        if (tokenIds[wallet] == 0) {
            _tokenIdCounter++;
            uint256 tokenId = _tokenIdCounter;
            _mint(wallet, tokenId);
            tokenIds[wallet] = tokenId;
            emit ScoreMinted(wallet, tokenId, score, tier);
        } else {
            emit ScoreUpdated(wallet, oldScore, score, tier);
        }

        scores[wallet] = Score({
            totalScore: score,
            tier: tier,
            timestamp: uint32(block.timestamp),
            metadataURI: metadataURI
        });
    }

    function updateScore(
        address wallet,
        uint8 newScore,
        uint8 newTier,
        string memory newMetadataURI
    ) external onlyOwner {
        require(tokenIds[wallet] != 0, "No NFT exists");
        
        uint8 oldScore = scores[wallet].totalScore;
        
        scores[wallet] = Score({
            totalScore: newScore,
            tier: newTier,
            timestamp: uint32(block.timestamp),
            metadataURI: newMetadataURI
        });
        
        emit ScoreUpdated(wallet, oldScore, newScore, newTier);
    }

    function getScore(address wallet) external view returns (Score memory) {
        return scores[wallet];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        // Find owner of tokenId to get their score
        address tokenOwner = ownerOf(tokenId);
        return scores[tokenOwner].metadataURI;
    }

    function hasScore(address wallet) external view returns (bool) {
        return tokenIds[wallet] != 0;
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    // Soulbound: block transfers (only allow minting)
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        require(from == address(0), "Soulbound: non-transferable");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @dev AlohaToken is a smart contract designed to mint tokens by surfing.
 * - Each surfer has an Alias that can’t change, an address and profile info hash.
 * - The profile info hash saves more information about the surfer offchain.
 * - The surfers cryptographically agree on surf sessions they have in real life.
 * - There is a time limit between new surf sessions addition.
 * - Each session mints a token per wave, 5 tokens to best surfer and burns 3 tokens
 *   to the kook surfer of the session.
 * - There is a time limit between new surfers addition.
 * - After a surfer is added it requires a minimum number of approvals from other surfers
 *   in order to be able to add and approve surf sessions.
 * - The tokens can’t be transferred, they are only for the surfer to keep.
 * - The contract owner can mint and burn tokens, set the minimum approvals,
 *   set the surfer add time interval and set the session add time interval.
 * - The contract owner can delete and edit surfers.
 */
 
// Note: surferID = keccak256(alias)
event SurferAdded(bytes32 indexed surferID);
event SurferApproved(bytes32 indexed fromID, bytes32 indexed toID);
event SurfSessionCreated(bytes32 indexed sessionHash);
event SurfSessionApproved(
    bytes32 indexed sessionHash,
    bytes32 indexed surfer
);
event SurfSessionFinalized(bytes32 indexed sessionHash);
event SurferDeleted(bytes32 indexed surfer);
event SurferEdited(bytes32 indexed surfer);

contract AlohaToken is ERC20, Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    struct Surfer {
        address owner;
        string surferAlias;
        bytes32[] approvals;
        string offchainInfoHash;
    }

    struct SurfSession {
        bool approved;
        string offchainInfoHash;
        bytes32[] surfers;
        uint256[] waves;
        bytes32 bestWaveSurfer;
        bytes32 kookSurfer;
        uint256 sessionTime;
        bool[] approvals;
        uint256 totalApprovals;
    }

    // replace string keys with bytes32 IDs
    mapping(bytes32 => Surfer) public surfers;
    mapping(address => bytes32) public surferIDByAddress;
    bytes32[] public surfersList;
    mapping(bytes32 => mapping(bytes32 => bool)) public approvals; // fromID => toID

    mapping(bytes32 => SurfSession) public surfSessions;
    bytes32[] public surfSessionsList;

    uint256 public lastSurferAdded;
    uint256 public lastSessionTime;
    uint256 public minApprovals;
    uint256 public surferAddTimeInterval;
    uint256 public sessionAddTimeInterval;

    /**
     * @dev Initializes the contract by adding initial surfers.
     * @param initialOwner The address of the initial owner of the contract.
     * @param _minApprovals The minimum number of approvals required to approve a new surfer.
     * @param _surferAddTimeInterval The time interval in seconds between adding new surfers.
     * @param _sessionAddTimeInterval The time interval in seconds between adding new sessions.
     * @param initialSurfersAddresses The addresses of the initial surfers.
     * @param initialSurfersAliases The alias of the initial surfers.
     * @param initialSurfersOffchainInfoHashes The IPFS hashes of the initial surfers’ profiles.
     */
    constructor(
        address initialOwner,
        uint256 _minApprovals,
        uint256 _surferAddTimeInterval,
        uint256 _sessionAddTimeInterval,
        address[] memory initialSurfersAddresses,
        string[] memory initialSurfersAliases,
        string[] memory initialSurfersOffchainInfoHashes
    ) ERC20("Aloha", "ALH") Ownable(initialOwner) {
        minApprovals = _minApprovals;
        surferAddTimeInterval = _surferAddTimeInterval;
        sessionAddTimeInterval = _sessionAddTimeInterval;

        // Add initial surfers
        for (uint256 i = 0; i < initialSurfersAddresses.length; i++) {
            bytes32 initialSurferID = hashString(
                initialSurfersAliases[i]
            );
            surfers[initialSurferID].owner = initialSurfersAddresses[i];
            surfers[initialSurferID].surferAlias = initialSurfersAliases[i];
            surfers[initialSurferID]
                .offchainInfoHash = initialSurfersOffchainInfoHashes[i];
            surferIDByAddress[
                initialSurfersAddresses[i]
            ] = initialSurferID;
            surfersList.push(initialSurferID);
        }
    }

    /**
     * @dev Modifier to make a function callable only by a surfer.
     */
    modifier onlySurfer() {
        require(isSurferByAddress(msg.sender), "Not a surfer");
        _;
    }

    /**
     * @dev Adds a new surfer, the surfer address is the msg.sender.
     * @param surferAlias The alias of the surfer.
     * @param offchainInfoHash The IPFS hash of the surfer's profile.
     */
    function addSurfer(
        string calldata surferAlias,
        string memory offchainInfoHash
    ) external nonReentrant {
        require(
            block.timestamp >= lastSurferAdded + surferAddTimeInterval,
            "Only one surfer can be added per day"
        );
        require(bytes(surferAlias).length != 0, "Alias cannot be empty");
        require(
            bytes(offchainInfoHash).length > 0,
            "offchainInfoHash cannot be empty"
        );
        require(!isSurferByAddress(msg.sender), "Already a surfer");

        bytes32 surferID = hashString(surferAlias);
        surferIDByAddress[msg.sender] = surferID;
        surfers[surferID].owner = msg.sender;
        surfers[surferID].surferAlias = surferAlias;
        surfers[surferID].offchainInfoHash = offchainInfoHash;
        surfersList.push(surferID);
        lastSurferAdded = block.timestamp;
        emit SurferAdded(surferID);
    }

    /**
     * @dev Approves multiple surfers.
     * @param surferIDsToApprove The IDs of the surfers to approve.
     */
    function approveSurfers(
        bytes32[] calldata surferIDsToApprove
    ) external onlySurfer nonReentrant {
        bytes32 senderID = surferIDByAddress[msg.sender];
        require(surferIDsToApprove.length > 0, "Not enough approvals");
        for (uint i = 0; i < surferIDsToApprove.length; i++) {
            bytes32 toID = surferIDsToApprove[i];
            require(senderID != toID, "Cant approve yourself");
            require(isSurferByID(toID), "Not a surfer");
            require(!approvals[senderID][toID], "Already approved");
            approvals[senderID][toID] = true;
            surfers[toID].approvals.push(senderID);
            emit SurferApproved(senderID, toID);
        }
    }

    /**
     * @dev Approves a new surfer with off chain signatures
     * @param surferIDToApprove The alias of the surfer to approve.
     * @param signers The addresses of the signers.
     * @param signatures The signatures of the signers.
     */
    function approveSurferWithSignatures(
        bytes32 surferIDToApprove,
        address[] calldata signers,
        bytes[] calldata signatures
    ) external onlySurfer nonReentrant {
        require(
            signers.length == signatures.length,
            "Signers and signatures length mismatch"
        );
        
        for (uint256 i = 0; i < signers.length; i++) {
            address signer = ECDSA.recover(
                MessageHashUtils.toEthSignedMessageHash(surferIDToApprove),
                signatures[i]
            );
            bytes32 signerID = surferIDByAddress[signers[i]];

            require(signer == signers[i], "Invalid signature");
            require(isSurferByAddress(signer), "Signer is not a surfer");
            require(
                !approvals[signerID][surferIDToApprove],
                "Already approved by this surfer"
            );

            approvals[signerID][
                surferIDToApprove
            ] = true;
            surfers[surferIDToApprove].approvals.push(signerID);
            emit SurferApproved(
                surferIDByAddress[signer],
                surferIDToApprove
            );
        }
    }

    /*
     * @dev Adds a surf session.
     * @param sessionSurfers The IDs of the surfers in the session.
     * @param waves The number of waves ridden by each surfer.
     * @param bestWaveSurfer The ID of the surfer with the best wave.
     * @param kookSurfer The ID of the kook surfer.
     * @param sessionTime The timestamp of the session.
     * @param surferApprovalIndex The index of the surfer who approved the session.
     * @param offchainInfoHash The IPFS hash of the session information.
     */
    function addSurfSession(
        bytes32[] calldata sessionSurfers,
        uint256[] memory waves,
        bytes32 bestWaveSurfer,
        bytes32 kookSurfer,
        uint256 sessionTime,
        string memory offchainInfoHash
    ) external onlySurfer nonReentrant {
        require(
            sessionSurfers.length == waves.length,
            "Surfers and waves length mismatch"
        );
        require(
            surfers[sessionSurfers[0]].owner == msg.sender,
            "First surfer should be the sender"
        );
        require(
            sessionTime < block.timestamp,
            "Session time must be in the past"
        );

        bytes32 surfSessionHash = keccak256(
            abi.encodePacked(
                sessionSurfers,
                waves,
                bestWaveSurfer,
                kookSurfer,
                sessionTime,
                offchainInfoHash
            )
        );

        require(
            bytes(surfSessions[surfSessionHash].offchainInfoHash).length == 0,
            "Session already exists"
        );

        surfSessions[surfSessionHash] = SurfSession({
            approved: false,
            offchainInfoHash: offchainInfoHash,
            surfers: sessionSurfers,
            waves: waves,
            bestWaveSurfer: bestWaveSurfer,
            kookSurfer: kookSurfer,
            sessionTime: sessionTime,
            approvals: new bool[](sessionSurfers.length),
            totalApprovals: 1
        });
        surfSessions[surfSessionHash].approvals[0] = true;

        emit SurfSessionCreated(surfSessionHash);
    }

    /**
     * @dev Approve a surf session, if the approval is the last one, it will mint the tokens and approve the session.
     * @param surfSessionHash The hash of the surf session.
     * @param surferApprovalIndex The index of the surfer who approved the session.
     */
    function approveSurfSession(
        bytes32 surfSessionHash,
        uint256 surferApprovalIndex
    ) external onlySurfer nonReentrant {
        SurfSession storage surfSession = surfSessions[surfSessionHash];
        require(
            surfers[surfSession.surfers[surferApprovalIndex]].owner ==
                msg.sender,
            "Not a surfer in the session"
        );
        require(
            !surfSession.approvals[surferApprovalIndex],
            "Already approved"
        );

        surfSession.approvals[surferApprovalIndex] = true;
        surfSession.totalApprovals++;

        // emit one-at-a-time approval
        emit SurfSessionApproved(
            surfSessionHash,
            surfSession.surfers[surferApprovalIndex]
        );

        // finalization when everyone has signed
        if (surfSession.totalApprovals == surfSession.surfers.length) {
            require(
                block.timestamp >= lastSessionTime + sessionAddTimeInterval,
                "Session time interval limit exceeded"
            );
            lastSessionTime = block.timestamp;
            for (uint256 i = 0; i < surfSession.surfers.length; i++) {
                _mint(
                    getSurferByID(surfSession.surfers[i]).owner,
                    surfSession.waves[i] * 10 ** decimals()
                );
            }

            if (surfSession.bestWaveSurfer != bytes32(0))
                _mint(
                    getSurferByID(surfSession.bestWaveSurfer).owner,
                    5 * 10 ** decimals()
                );

            if (surfSession.kookSurfer != bytes32(0))
                if (
                    balanceOf(getSurferByID(surfSession.kookSurfer).owner) <
                    3 * 10 ** decimals()
                ) {
                    _burn(
                        getSurferByID(surfSession.kookSurfer).owner,
                        balanceOf(
                            getSurferByID(surfSession.kookSurfer).owner
                        )
                    );
                } else {
                    _burn(
                        getSurferByID(surfSession.kookSurfer).owner,
                        3 * 10 ** decimals()
                    );
                }

            surfSession.approved = true;
            surfSessionsList.push(surfSessionHash);
            emit SurfSessionFinalized(surfSessionHash);
        }
    }

    /**
     * @dev Approve a surf session with signatures.
     * @param surfSessionHash The hash of the surf session.
     * @param surferApprovalIndexes The indexes of the signers in the surfers array.
     * @param signatures The signatures of the surfers.
     */
    function approveSurfSessionWithSignatures(
        bytes32 surfSessionHash,
        uint256[] calldata surferApprovalIndexes,
        bytes[] calldata signatures
    ) external onlySurfer nonReentrant {
        require(
            signatures.length == surferApprovalIndexes.length,
            "Signatures length mismatch"
        );

        SurfSession storage surfSession = surfSessions[surfSessionHash];

        for (uint256 i = 0; i < surferApprovalIndexes.length; i++) {
            address signer = ECDSA.recover(
                MessageHashUtils.toEthSignedMessageHash(surfSessionHash),
                signatures[i]
            );
            Surfer memory surfer = getSurferByID(
                surfSession.surfers[surferApprovalIndexes[i]]
            );
            require(signer == surfer.owner, "Invalid signature");
            require(
                surfer.approvals.length >= minApprovals,
                "Signer is not approved"
            );

            surfSessions[surfSessionHash].approvals[
                surferApprovalIndexes[i]
            ] = true;
            surfSessions[surfSessionHash].totalApprovals++;

            emit SurfSessionApproved(
                surfSessionHash,
                surfSession.surfers[surferApprovalIndexes[i]]
            );
        }

        // finalization when everyone has signed
        if (surfSession.totalApprovals == surfSession.surfers.length) {
            require(
                block.timestamp >= lastSessionTime + sessionAddTimeInterval,
                "Session time interval limit exceeded"
            );
            lastSessionTime = block.timestamp;
            for (uint256 i = 0; i < surfSession.surfers.length; i++) {
                _mint(
                    getSurferByID(surfSession.surfers[i]).owner,
                    surfSession.waves[i] * 10 ** decimals()
                );
            }

            if (surfSession.bestWaveSurfer != bytes32(0))
                _mint(
                    getSurferByID(surfSession.bestWaveSurfer).owner,
                    5 * 10 ** decimals()
                );

            if (surfSession.kookSurfer != bytes32(0))
                if (
                    balanceOf(getSurferByID(surfSession.kookSurfer).owner) <
                    3 * 10 ** decimals()
                ) {
                    _burn(
                        getSurferByID(surfSession.kookSurfer).owner,
                        balanceOf(
                            getSurferByID(surfSession.kookSurfer).owner
                        )
                    );
                } else {
                    _burn(
                        getSurferByID(surfSession.kookSurfer).owner,
                        3 * 10 ** decimals()
                    );
                }

            surfSession.approved = true;
            surfSessionsList.push(surfSessionHash);
            emit SurfSessionFinalized(surfSessionHash);
        }
    }

    /**
     * @dev Adds a surf session.
     * @param sessionSurfers The IDs of the surfers in the session.
     * @param waves The number of waves ridden by each surfer.
     * @param bestWaveSurfer The ID of the surfer with the best wave.
     * @param kookSurfer The ID of the kook surfer.
     * @param sessionTime The timestamp of the session.
     * @param signatures The signatures of the surfers.
     * @param offchainInfoHash The IPFS hash of the session information.
     */
    function addSurfSessionWithSignatures(
        bytes32[] calldata sessionSurfers,
        uint256[] memory waves,
        bytes32 bestWaveSurfer,
        bytes32 kookSurfer,
        uint256 sessionTime,
        bytes[] calldata signatures,
        string memory offchainInfoHash
    ) external onlySurfer nonReentrant {
        require(
            sessionSurfers.length == waves.length,
            "Surfers and waves length mismatch"
        );
        require(
            signatures.length == sessionSurfers.length,
            "Signatures length mismatch"
        );
        require(
            sessionTime < block.timestamp,
            "Session time must be in the past"
        );

        bytes32 surfSessionHash = keccak256(
            abi.encodePacked(
                sessionSurfers,
                waves,
                bestWaveSurfer,
                kookSurfer,
                sessionTime,
                offchainInfoHash
            )
        );

        require(
            bytes(surfSessions[surfSessionHash].offchainInfoHash).length == 0,
            "Session already exists"
        );

        surfSessions[surfSessionHash] = SurfSession({
            approved: false,
            offchainInfoHash: offchainInfoHash,
            surfers: sessionSurfers,
            waves: waves,
            bestWaveSurfer: bestWaveSurfer,
            kookSurfer: kookSurfer,
            sessionTime: sessionTime,
            approvals: new bool[](sessionSurfers.length),
            totalApprovals: 0
        });

        for (uint256 i = 0; i < sessionSurfers.length; i++) {
            address signer = ECDSA.recover(
                MessageHashUtils.toEthSignedMessageHash(surfSessionHash),
                signatures[i]
            );
            require(
                signer == surfers[sessionSurfers[i]].owner,
                "Invalid signature"
            );
            require(
                isSurferByID(sessionSurfers[i]),
                "Signer is not a surfer"
            );
            require(
                surfers[sessionSurfers[i]].approvals.length >= minApprovals,
                "Signer is not approved"
            );
            require(
                block.timestamp >= lastSessionTime + sessionAddTimeInterval,
                "Session time interval limit exceeded"
            );
            _mint(
                surfers[sessionSurfers[i]].owner,
                waves[i] * 10 ** decimals()
            );
            surfSessions[surfSessionHash].approvals[i] = true;
            surfSessions[surfSessionHash].totalApprovals++;
        }

        if (bestWaveSurfer != bytes32(0))
            _mint(getSurferByID(bestWaveSurfer).owner, 5 * 10 ** decimals());

        if (kookSurfer != bytes32(0))
            if (
                balanceOf(getSurferByID(kookSurfer).owner) <
                3 * 10 ** decimals()
            ) {
                _burn(
                    getSurferByID(kookSurfer).owner,
                    balanceOf(getSurferByID(kookSurfer).owner)
                );
            } else {
                _burn(getSurferByID(kookSurfer).owner, 3 * 10 ** decimals());
            }

        lastSessionTime = block.timestamp;
        surfSessions[surfSessionHash].approved = true;
        surfSessionsList.push(surfSessionHash);

        emit SurfSessionFinalized(surfSessionHash);
    }

    /**
     * @dev Returns the list of surfers.
     * @return The list of surfer addresses.
     */
    function getSurferList() external view returns (bytes32[] memory) {
        return surfersList;
    }

    /**
     * @dev Mints new tokens.
     * @param to The address to mint tokens to.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Burns tokens.
     * @param to The address to burn tokens from.
     * @param amount The amount of tokens to burn.
     */
    function burn(address to, uint256 amount) external onlyOwner {
        _burn(to, amount);
    }

    /**
     * @dev Sets the minimum number of approvals required to approve a new surfer.
     * @param newMinApprovals The new minimum number of approvals.
     */
    function setMinApprovals(uint256 newMinApprovals) external onlyOwner {
        minApprovals = newMinApprovals;
    }

    /**
     * @dev Sets the interval between adding new surfers.
     * @param newSurferAddInterval The new interval in seconds.
     */
    function setSurferAddInterval(
        uint256 newSurferAddInterval
    ) external onlyOwner {
        surferAddTimeInterval = newSurferAddInterval;
    }

    /**
     * @dev Sets the interval between adding new sessions.
     * @param newSessionAddTimeInterval The new interval in seconds.
     */
    function setSessionAddTimeInterval(
        uint256 newSessionAddTimeInterval
    ) external onlyOwner {
        sessionAddTimeInterval = newSessionAddTimeInterval; // renamed to match setter name
    }

    /**
     * @dev Deletes a surfer.
     * @param surferID The address of the surfer to delete.
     * @param i The index of the surfer in the surfer list.
     */
    function deleteSurfer(
        bytes32 surferID,
        uint256 i
    ) external nonReentrant {
        require(isSurferByID(surferID), "Not a surfer");
        require(surfersList[i] == surferID, "Wrong index");
        require(
            msg.sender == owner() || msg.sender == surfers[surferID].owner,
            "Not authorized"
        );

        uint256 tokenBalance = balanceOf(surfers[surferID].owner);
        _burn(surfers[surferID].owner, tokenBalance);
        delete surfers[surferID];
        surfersList[i] = surfersList[surfersList.length - 1];
        surfersList.pop();
        emit SurferDeleted(surferID);
    }

    /**
     * @dev Edits a surfer's address, alias, and profile hash.
     * @param surferID The address of the surfer to edit.
     * @param i The index of the surfer in the surfer list.
     * @param newAddress The new address of the surfer.
     * @param newOffchainInfoHash The new IPFS hash of the surfer's profile.
     */
    function editSurfer(
        bytes32 surferID,
        uint256 i,
        address newAddress,
        string memory newOffchainInfoHash
    ) external nonReentrant {
        require(isSurferByID(surferID), "Not a surfer");
        require(surfersList[i] == surferID, "Wrong index");
        require(
            msg.sender == owner() || msg.sender == surfers[surferID].owner,
            "Not authorized"
        );
        require(
            surfers[surferID].owner == newAddress ||
                !isSurferByAddress(newAddress),
            "Address already in use"
        );

        uint256 tokenBalance = balanceOf(surfers[surferID].owner);
        _burn(surfers[surferID].owner, tokenBalance);
        _mint(newAddress, tokenBalance);
        surfers[surferID].owner = newAddress;
        surfers[surferID].offchainInfoHash = newOffchainInfoHash;
        emit SurferEdited(surferID);
    }

    /**
     * @dev Overrides the transferFrom function to make the token non-transferable.
     * @param from The address to transfer from.
     * @param to The address to transfer to.
     * @param value The amount to transfer.
     */
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public override returns (bool) {
        revert("Token is non-transferable");
    }

    /**
     * @dev Overrides the transfer function to make the token non-transferable.
     * @param to The address to transfer to.
     * @param value The amount to transfer.
     */
    function transfer(
        address to,
        uint256 value
    ) public override returns (bool) {
        revert("Token is non-transferable");
    }

    /**
     * @notice Hashes a string using keccak256.
     * @dev Used for hashing surfer IDs and other strings.
     * @param str The string to hash.
     * @return The keccak256 hash of the string.
     */
    function hashString(
        string memory str
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(str));
    }

    /**
     * @notice Checks whether an address is a registered surfer.
     * @param surferAddress The address to check.
     * @return True if the address is a registered surfer.
     */
    function isSurferByAddress(
        address surferAddress
    ) public view returns (bool) {
        return surferIDByAddress[surferAddress] != bytes32(0);
    }
    
    /**
     * @notice Checks whether a surfer ID corresponds to a registered surfer.
     * @param surferID The ID to check.
     * @return True if the ID is a registered surfer.
     */
    function isSurferByID(bytes32 surferID) public view returns (bool) {
        return surfers[surferID].owner != address(0);
    }

    /**
     * @notice Retrieves the Surfer struct for a given id.
     * @param surferId The alias of the surfer.
     * @return owner The address of the surfer.
     * @return surferAlias The alias of the surfer.
     * @return surferApprovals The list of approvals for the surfer.
     * @return offchainInfoHash The IPFS hash of the surfer's profile.
     */
    function getSurfer(
        bytes32 surferId
    ) public view returns (address owner, string memory surferAlias, bytes32[] memory surferApprovals, string memory offchainInfoHash) {
        return (surfers[surferId].owner,
            surfers[surferId].surferAlias,
            surfers[surferId].approvals,
            surfers[surferId].offchainInfoHash);
    }

    /**
     * @notice Retrieves the Surfer struct for a given alias.
     * @param surferId The alias of the surfer.
     * @return info The Surfer struct containing the surfer’s data.
     */
    function getSurferByID(
        bytes32 surferId
    ) public view returns (Surfer memory info) {
        return surfers[surferId];
    }

    /**
     * @notice Retrieves the list of surf session hashes.
     * @return surfSessionsList An array of surf session hashes.
     */
    function getSurfSessions() external view returns (bytes32[] memory) {
        return surfSessionsList;
    }

    /**
     * @notice Retrieves the list of surfers ids.
     * @return getSurfersList An array of surfers id.
     */
    function getSurfersList() external view returns (bytes32[] memory) {
        return surfersList;
    }

    /**
     * @notice Retrieves the surf session information for a given session hash.
     * @return SurfSession the surf session information.
     */
    function getSurfSession(
        bytes32 sessionHash
    ) external view returns (SurfSession memory) {
        return surfSessions[sessionHash];
    }

    /**
     * @notice Checks whether a specific approver has approved the surfer.
     * @param fromID The address that did the approving.
     * @param toID The address to check for approval.
     * @return status True if the surfer from approve the surfer to; otherwise, false.
     */
    function getSurferApproval(
        bytes32 fromID,
        bytes32 toID
    ) external view returns (bool) {
        return approvals[fromID][toID];
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Move this OUTSIDE the contract!
interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

/**
 * @title LendingVault
 * @notice ETH-collateralized lending contract with USDC repayment and auto-withdrawal
 */
contract LendingVault {
    // Loan struct
    struct Loan {
        uint256 ethAmount;
        uint256 usdcAmount;
        bool repaid;
        bool active;
    }

    // USDC token address (configurable)
    address public usdcToken;
    address public owner;

    // User => loanId => Loan
    mapping(address => mapping(string => Loan)) public loans;
    // User => number of loans (for incremental loanId)
    mapping(address => uint256) public userLoanCount;

    // Events
    event LoanOriginated(address indexed user, string loanId, uint256 ethAmount, uint256 usdcAmount, string usdcChain, address usdcAddress);
    event LoanRepaid(address indexed user, string loanId, uint256 usdcAmount);
    event CollateralWithdrawn(address indexed user, string loanId, uint256 ethAmount);
    event UsdcTokenChanged(address indexed newToken);
    event LoanMarkedRepaid(address indexed user, string loanId);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyCrossChainAdder() {
        require(msg.sender == 0xbE397e8CA911009E5d0513B89f3FF8ca02d24c29, "Not cross-chain adder");
        _;
    }

    constructor(address _usdcToken) {
        require(_usdcToken != address(0), "USDC address required");
        usdcToken = _usdcToken;
        owner = msg.sender;
    }

    // Owner can update USDC token address
    function setUsdcToken(address _usdcToken) external onlyOwner {
        require(_usdcToken != address(0), "USDC address required");
        usdcToken = _usdcToken;
        emit UsdcTokenChanged(_usdcToken);
    }

    /**
     * @notice Originate a new loan by locking ETH. The USDC repayment amount is fixed per loan.
     * @param loanId The ID of the loan.
     * @param usdcAmount The amount of USDC to be repaid for this loan.
     * @param usdcChain The chain of the USDC token.
     * @param usdcAddress The address of the USDC token.
     */
    function originateLoan(string memory loanId, uint256 usdcAmount, string memory usdcChain, address usdcAddress) external payable {
        require(msg.value > 0, "ETH required");
        require(usdcAmount > 0, "USDC amount required");
        require(!loans[msg.sender][loanId].active, "Loan already exists");
        loans[msg.sender][loanId] = Loan({
            ethAmount: msg.value,
            usdcAmount: usdcAmount,
            repaid: false,
            active: true
        });
        emit LoanOriginated(msg.sender, loanId, msg.value, usdcAmount, usdcChain, usdcAddress);
    }

    /**
     * @notice Repay a loan in USDC for any user. Anyone can repay, but ETH is always returned to the original user.
     *         For cross-chain clone loans (loanId >= 1_000_000), only mark as repaid and emit LoanMarkedRepaid.
     * @param user The address of the loan creator.
     * @param loanId The ID of the loan to repay.
     */
    function repayLoan(address user, string memory loanId) external {
        Loan storage loan = loans[user][loanId];
        require(loan.active, "Loan inactive");
        require(!loan.repaid, "Already repaid");
        require(loan.usdcAmount > 0, "Invalid loan");
        IERC20 usdc = IERC20(usdcToken);
        require(usdc.allowance(msg.sender, address(this)) >= loan.usdcAmount, "Insufficient allowance");
        require(usdc.transferFrom(msg.sender, address(this), loan.usdcAmount), "USDC transfer failed");
        loan.repaid = true;
        if (_isCrossChainLoan(loanId)) {
            emit LoanMarkedRepaid(user, loanId);
        } else {
            emit LoanRepaid(user, loanId, loan.usdcAmount);
            _withdrawCollateral(user, loanId);
        }
    }

    /**
     * @notice Internal function to withdraw ETH collateral after repayment.
     * @param user The address of the user.
     * @param loanId The ID of the loan.
     */
    function _withdrawCollateral(address user, string memory loanId) internal {
        Loan storage loan = loans[user][loanId];
        require(loan.active, "Loan inactive");
        require(loan.repaid, "Loan not repaid");
        uint256 ethAmount = loan.ethAmount;
        require(ethAmount > 0, "No ETH to withdraw");
        // Mark loan as inactive and zero out amounts
        loan.active = false;
        loan.ethAmount = 0;
        loan.usdcAmount = 0;
        // Transfer ETH back to user
        (bool sent, ) = user.call{value: ethAmount}("");
        require(sent, "ETH transfer failed");
        emit CollateralWithdrawn(user, loanId, ethAmount);
    }

    /**
     * @notice View function to get loan details for a user and loanId.
     */
    function getLoan(address user, string memory loanId) external view returns (uint256 ethAmount, uint256 usdcAmount, bool repaid, bool active) {
        Loan storage loan = loans[user][loanId];
        return (loan.ethAmount, loan.usdcAmount, loan.repaid, loan.active);
    }

    /**
     * @notice Mark a loan as repaid from another chain (no ETH unlock). Only cross-chain adder can call.
     */
    function markLoanRepaidFromOtherChain(address user, string memory loanId) external onlyCrossChainAdder {
        Loan storage loan = loans[user][loanId];
        require(loan.active, "Loan inactive");
        require(!loan.repaid, "Already repaid");
        loan.repaid = true;
        if (!_isCrossChainLoan(loanId)) {
            emit LoanRepaid(user, loanId, loan.usdcAmount);
            _withdrawCollateral(user, loanId);
        } else {
            emit LoanMarkedRepaid(user, loanId);
        }
    }

    /**
     * @notice Only cross-chain adder can withdraw USDC accumulated in the contract.
     */
    function withdrawUSDC(address to, uint256 amount) external onlyCrossChainAdder {
        require(to != address(0), "Invalid address");
        IERC20 usdc = IERC20(usdcToken);
        require(usdc.balanceOf(address(this)) >= amount, "Insufficient USDC");
        require(usdc.transfer(to, amount), "USDC transfer failed");
    }

    /**
     * @notice Only cross-chain adder can withdraw ETH from the contract.
     */
    function withdrawETH(address to, uint256 amount) external onlyCrossChainAdder {
        require(to != address(0), "Invalid address");
        require(address(this).balance >= amount, "Insufficient ETH");
        (bool sent, ) = to.call{value: amount}("");
        require(sent, "ETH transfer failed");
    }

    /**
     * @notice Add a loan from another chain. Only allowed by a specific address. Will not overwrite existing loans.
     * @param user The address of the loan creator.
     * @param loanId The ID of the loan.
     * @param ethAmount The amount of ETH locked.
     * @param usdcAmount The amount of USDC to be repaid.
     */
    function addLoanFromOtherChain(address user, string memory loanId, uint256 ethAmount, uint256 usdcAmount) external onlyCrossChainAdder {
        require(user != address(0), "Invalid user");
        require(ethAmount > 0, "ETH required");
        require(usdcAmount > 0, "USDC amount required");
        require(!loans[user][loanId].active, "Loan already exists");
        loans[user][loanId] = Loan({
            ethAmount: ethAmount,
            usdcAmount: usdcAmount,
            repaid: false,
            active: true
        });
        emit LoanOriginated(user, loanId, ethAmount, usdcAmount, "", address(0));
    }

    // Helper to detect cross-chain loan by presence of dash in loanId
    function _isCrossChainLoan(string memory loanId) internal pure returns (bool) {
        bytes memory b = bytes(loanId);
        for (uint i = 0; i < b.length; i++) {
            if (b[i] == "-" ) {
                return true;
            }
        }
        return false;
    }

    // Fallback to reject accidental ETH transfers
    receive() external payable {
        revert("Direct ETH not allowed");
    }
    fallback() external payable {
        revert("Direct ETH not allowed");
    }
} 
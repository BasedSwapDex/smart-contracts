// SPDX-License-Identifier: MIT
pragma solidity =0.8.11;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract MasterChef is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    using SafeMathUpgradeable for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
    }

    struct PoolInfo {
        IERC20Upgradeable lpToken;
        uint256 allocPoint;
        uint256 lastRewardBlock;
        uint256 accBasedPerShare;
    }

    IERC20Upgradeable public based;
    address public adminaddr;
    uint256 public basedPerBlock;

    PoolInfo[] public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    uint256 public totalAllocPoint;
    uint256 public startBlock;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(
        address indexed user,
        uint256 indexed pid,
        uint256 amount
    );
    event setAdmin(address oldAdminaddr, address newAdminaddr);
    event safeBasedReward(uint256 basedBal, uint256 amount);
    event RewardPerBlock(uint256 oldRewardPerBlock, uint256 newRewardPerBlock);

    function initialize(
        IERC20Upgradeable _based,
        address _adminaddr,
        uint256 _basedPerBlock,
        uint256 _startBlock
    ) external initializer {
        __Ownable_init();

        require(address(_based) != address(0), "Invalid based address");
        require(address(_adminaddr) != address(0), "Invalid admin address");

        based = _based;
        adminaddr = _adminaddr;
        basedPerBlock = _basedPerBlock;
        startBlock = _startBlock;
        totalAllocPoint = 0;
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    function add(
        uint256 _allocPoint,
        IERC20Upgradeable _lpToken,
        bool _withUpdate
    ) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock = block.number > startBlock
            ? block.number
            : startBlock;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        poolInfo.push(
            PoolInfo({
                lpToken: _lpToken,
                allocPoint: _allocPoint,
                lastRewardBlock: lastRewardBlock,
                accBasedPerShare: 0
            })
        );
    }

    function set(
        uint256 _pid,
        uint256 _allocPoint,
        bool _withUpdate
    ) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        totalAllocPoint = totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(
            _allocPoint
        );
        poolInfo[_pid].allocPoint = _allocPoint;
    }

    function getMultiplier(
        uint256 _from,
        uint256 _to
    ) public pure returns (uint256) {
        if (_to >= _from) {
            return _to.sub(_from);
        } else {
            return _from.sub(_to);
        }
    }

    function pendingBased(
        uint256 _pid,
        address _user
    ) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accBasedPerShare = pool.accBasedPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(
                pool.lastRewardBlock,
                block.number
            );
            uint256 basedReward = multiplier
                .mul(basedPerBlock)
                .mul(pool.allocPoint)
                .div(totalAllocPoint);
            accBasedPerShare = accBasedPerShare.add(
                basedReward.mul(1e12).div(lpSupply)
            );
        }
        return user.amount.mul(accBasedPerShare).div(1e12).sub(user.rewardDebt);
    }

    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 basedReward = multiplier
            .mul(basedPerBlock)
            .mul(pool.allocPoint)
            .div(totalAllocPoint);
        pool.accBasedPerShare = pool.accBasedPerShare.add(
            basedReward.mul(1e12).div(lpSupply)
        );
        pool.lastRewardBlock = block.number;
    }

    function deposit(uint256 _pid, uint256 _amount) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);
        if (user.amount > 0) {
            uint256 pending = user
                .amount
                .mul(pool.accBasedPerShare)
                .div(1e12)
                .sub(user.rewardDebt);
            safeBasedTransfer(msg.sender, pending);
        }
        pool.lpToken.safeTransferFrom(
            address(msg.sender),
            address(this),
            _amount
        );
        user.amount = user.amount.add(_amount);
        user.rewardDebt = user.amount.mul(pool.accBasedPerShare).div(1e12);
        emit Deposit(msg.sender, _pid, _amount);
    }

    function withdraw(uint256 _pid, uint256 _amount) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        updatePool(_pid);
        uint256 pending = user.amount.mul(pool.accBasedPerShare).div(1e12).sub(
            user.rewardDebt
        );
        safeBasedTransfer(msg.sender, pending);
        user.amount = user.amount.sub(_amount);
        user.rewardDebt = user.amount.mul(pool.accBasedPerShare).div(1e12);
        pool.lpToken.safeTransfer(address(msg.sender), _amount);
        emit Withdraw(msg.sender, _pid, _amount);
    }

    function emergencyWithdraw(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        pool.lpToken.safeTransfer(address(msg.sender), user.amount);
        emit EmergencyWithdraw(msg.sender, _pid, user.amount);
        user.amount = 0;
        user.rewardDebt = 0;
    }

    function safeBasedTransfer(address _to, uint256 _amount) internal {
        uint256 basedBal = based.balanceOf(address(this));
        if (_amount > basedBal) {
            based.transfer(_to, basedBal);
        } else {
            based.transfer(_to, _amount);
        }
        emit safeBasedReward(basedBal, _amount);
    }

    // Update reward per block
    function updateBasedPerBlock(uint256 _basedPerBlock) public onlyOwner {
        massUpdatePools();
        emit RewardPerBlock(_basedPerBlock, basedPerBlock);
        basedPerBlock = _basedPerBlock;
    }

    // Update admin address by the previous admin.
    function admin(address _adminaddr) public {
        require(msg.sender == adminaddr, "admin: wut?");
        emit setAdmin(adminaddr, _adminaddr);
        adminaddr = _adminaddr;
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}

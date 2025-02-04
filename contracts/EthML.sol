pragma solidity ^0.5.16;

import './libraries/EthMLStorageLib.sol';
import './libraries/EthMLTransferLib.sol';
import './libraries/EthMLLib.sol';

/**
 * @dev Enhanced EthML implementation with support for multiple users and distributed training
 */
contract EthML {
    using EthMLLib for EthMLStorageLib.EthMLStorageStruct;
    using EthMLTransferLib for EthMLStorageLib.EthMLStorageStruct;

    EthMLStorageLib.EthMLStorageStruct ethML;
    
    // Mapping of user addresses to their roles
    mapping(address => bool) public trainers;
    mapping(address => bool) public validators;
    
    // Training task structure
    struct TrainingTask {
        uint256 modelId;
        address owner;
        string dataPoint;
        uint256 tip;
        bool isCompleted;
        mapping(address => bool) validators;
        uint256 validationCount;
        uint256 result;
    }
    
    // Task management
    mapping(uint256 => TrainingTask) public tasks;
    uint256 public taskCount;
    
    // Events
    event TaskCreated(uint256 indexed taskId, address indexed owner, uint256 modelId);
    event TaskValidated(uint256 indexed taskId, address indexed validator);
    event TaskCompleted(uint256 indexed taskId, uint256 result);
    
    modifier onlyTrainer() {
        require(trainers[msg.sender], "Not authorized as trainer");
        _;
    }
    
    modifier onlyValidator() {
        require(validators[msg.sender], "Not authorized as validator");
        _;
    }
    
    constructor() public {
        trainers[msg.sender] = true;
        validators[msg.sender] = true;
    }
    
    function registerTrainer(address _trainer) external {
        require(trainers[msg.sender], "Only trainers can add trainers");
        trainers[_trainer] = true;
    }
    
    function registerValidator(address _validator) external {
        require(validators[msg.sender], "Only validators can add validators");
        validators[_validator] = true;
    }

    /** 
     * @dev Enhanced request prediction with task distribution
     */
    function requestPrediction(uint256 _modelId, string calldata _dataPoint, uint256 _tip) 
        external 
        payable 
        returns(uint256)
    {
        require(msg.value >= _tip, "Insufficient payment for tip");
        
        taskCount++;
        TrainingTask storage task = tasks[taskCount];
        task.modelId = _modelId;
        task.owner = msg.sender;
        task.dataPoint = _dataPoint;
        task.tip = _tip;
        task.isCompleted = false;
        task.validationCount = 0;
        
        emit TaskCreated(taskCount, msg.sender, _modelId);
        return taskCount;
    }

    /**
     * @dev Submit validation for a training task
     */
    function submitValidation(uint256 _taskId, uint256 _prediction) 
        external 
        onlyValidator 
    {
        TrainingTask storage task = tasks[_taskId];
        require(!task.isCompleted, "Task already completed");
        require(!task.validators[msg.sender], "Already validated by this validator");
        
        task.validators[msg.sender] = true;
        task.validationCount++;
        
        if (task.validationCount == 1) {
            task.result = _prediction;
        }
        
        emit TaskValidated(_taskId, msg.sender);
        
        // Mark task as complete after sufficient validations
        if (task.validationCount >= 3) {
            task.isCompleted = true;
            // Distribute rewards
            address payable owner = address(uint160(task.owner));
            address payable validator = address(uint160(msg.sender));
            validator.transfer(task.tip / 3);
            owner.transfer(address(this).balance);
            
            emit TaskCompleted(_taskId, task.result);
        }
    }

    /**
     * @dev Get task details
     */
    function getTask(uint256 _taskId) 
        external 
        view 
        returns(
            uint256 modelId,
            address owner,
            string memory dataPoint,
            uint256 tip,
            bool isCompleted,
            uint256 validationCount,
            uint256 result
        ) 
    {
        TrainingTask storage task = tasks[_taskId];
        return (
            task.modelId,
            task.owner,
            task.dataPoint,
            task.tip,
            task.isCompleted,
            task.validationCount,
            task.result
        );
    }

    /* Token functions */
    function name() external pure returns(string memory) {
        return "EthML Token";
    }

    function symbol() external pure returns(string memory) {
        return "EML";
    }

    function decimals() external pure returns(uint256) {
        return 18;
    }
}


DROP TABLE IF EXISTS RefundHistory;
CREATE TABLE RefundHistory(
	 id         				BIGINT AUTO_INCREMENT PRIMARY KEY,
	 refundId  				    BIGINT				DEFAULT NULL,
	 displayRefundId            VARCHAR(32)         DEFAULT NULL,
	 refundStatus               ENUM("CREATED",
                                     "VERIFIED",
				   					  "REJECT",
                                     "APPROVED",               
                                     "EXECUTED",                
                                     "SUCCESS",                
                                     "FAILED")                   DEFAULT "CREATED",
                                
	verifierOperatorId          BIGINT              DEFAULT NULL,
  	verifierName                VARCHAR(64)         DEFAULT NULL,
	verifierMobile		   		VARCHAR(80)			DEFAULT NULL,
	verifiedTime                TIMESTAMP           DEFAULT 0,
   	verificationComment         TEXT                DEFAULT NULL,
	verifiedSum        			DECIMAL(16,6)       NOT NULL DEFAULT 0,
	
	  
	approverOperatorId          BIGINT              DEFAULT NULL,
	approverName                VARCHAR(64)         DEFAULT NULL,
	approverMobile		        VARCHAR(80)			DEFAULT NULL,
	approveTime                 TIMESTAMP           DEFAULT 0,
	approveComment              TEXT                DEFAULT NULL,

	rejecterOperatorId          BIGINT              DEFAULT NULL,
	rejecterMobile		    	VARCHAR(80) 		DEFAULT NULL,
	rejecterName                VARCHAR(64)         DEFAULT NULL,
	rejectTime                 	TIMESTAMP           DEFAULT 0,
	rejectComment		    	TEXT 				DEFAULT NULL,


	excuterOperatorId          BIGINT              DEFAULT NULL,
  	excuterName                VARCHAR(64)         DEFAULT NULL,
	excuterMobile		       VARCHAR(80)		   DEFAULT NULL,
	excuteTime                 TIMESTAMP           DEFAULT 0,
   
		
	

	
   	refundGatewayId             BIGINT              DEFAULT NULL,

   
   	payWaterbillNo              VARCHAR(64)         DEFAULT NULL,


	refundExecutionId           BIGINT              DEFAULT NULL,

	attachMentUrl		        TEXT 				DEFAULT NULL,
	
	financeAttachmentUrl	    TEXT           	    DEFAULT NULL,

	updatedOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	createdOn                   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
);

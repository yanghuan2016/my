
DROP TABLE IF EXISTS Complain;
CREATE TABLE Complain (
	id 					BIGINT 		AUTO_INCREMENT PRIMARY KEY,

    clientId            BIGINT      NOT NULL,

    operatorId          BIGINT      NOT NULL,

    /* 投诉的显示方式 上行或者下行 */
    type                ENUM("UP","DOWN") DEFAULT NULL,

	hasBeenRead	        BOOL        DEFAULT 0,

	content 		    VARCHAR(1000)	DEFAULT NULL,

    readOn 		        TIMESTAMP	DEFAULT CURRENT_TIMESTAMP,

    createdOn 		    TIMESTAMP	DEFAULT CURRENT_TIMESTAMP
);

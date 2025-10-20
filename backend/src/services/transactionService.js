import { executeQuery } from "../config/database.js";

const VOTES_TABLE = process.env.BLOCKCHAIN_TABLE || "votes_blockchain_v3";

/**
 * Get all blockchain transactions (simplified list view)
 */
export const getAllTransactions = async (filters = {}) => {
  let sql = `
    SELECT
      poll_id,
      option_id,
      vote_timestamp,
      poll_title,
      option_name,
      ORABCTAB_INST_ID$,
      ORABCTAB_CHAIN_ID$,
      ORABCTAB_SEQ_NUM$,
      RAWTOHEX(ORABCTAB_HASH$) as hash_hex
    FROM ${VOTES_TABLE}
    WHERE 1=1
  `;

  const binds = {};

  // Apply filters
  if (filters.pollId) {
    sql += " AND poll_id = :pollId";
    binds.pollId = filters.pollId;
  }

  if (filters.fromDate) {
    sql +=
      " AND vote_timestamp >= TO_TIMESTAMP(:fromDate, 'YYYY-MM-DD HH24:MI:SS')";
    binds.fromDate = filters.fromDate;
  }

  if (filters.toDate) {
    sql +=
      " AND vote_timestamp <= TO_TIMESTAMP(:toDate, 'YYYY-MM-DD HH24:MI:SS')";
    binds.toDate = filters.toDate;
  }

  sql += " ORDER BY ORABCTAB_CHAIN_ID$, ORABCTAB_SEQ_NUM$";

  // Apply limit
  if (filters.limit) {
    sql += " FETCH FIRST :limit ROWS ONLY";
    binds.limit = parseInt(filters.limit);
  }

  const result = await executeQuery(sql, binds);

  return result.rows.map((row) => ({
    action: "vote",
    pollId: row.POLL_ID,
    pollTitle: row.POLL_TITLE,
    optionId: row.OPTION_ID,
    optionName: row.OPTION_NAME,
    timestamp: row.VOTE_TIMESTAMP,
    hash: "0x" + row.HASH_HEX,
    chainSequence: row.ORABCTAB_SEQ_NUM$,
    chainId: row.ORABCTAB_CHAIN_ID$,
  }));
};

/**
 * Get detailed blockchain analysis with all Oracle columns
 */
export const getDetailedTransactionAnalysis = async () => {
  const sql = `
    SELECT
      poll_id,
      poll_title,
      option_name,
      ORABCTAB_INST_ID$ as instance_id,
      ORABCTAB_CHAIN_ID$ as chain_id,
      ORABCTAB_SEQ_NUM$ as sequence_number,
      ORABCTAB_CREATION_TIME$ as creation_time,
      ORABCTAB_USER_NUMBER$ as user_number,
      RAWTOHEX(ORABCTAB_HASH$) as block_hash,
      ORABCTAB_SIGNATURE_ALG$ as signature_algorithm,
      CASE
        WHEN ORABCTAB_SIGNATURE$ IS NOT NULL
        THEN RAWTOHEX(ORABCTAB_SIGNATURE$)
        ELSE NULL
      END as signature,
      CASE
        WHEN ORABCTAB_SPARE$ IS NOT NULL
        THEN RAWTOHEX(ORABCTAB_SPARE$)
        ELSE NULL
      END as spare_data
    FROM ${VOTES_TABLE}
    ORDER BY ORABCTAB_CHAIN_ID$, ORABCTAB_SEQ_NUM$
  `;

  const result = await executeQuery(sql);

  // Group by chain and calculate previous hashes
  const chains = {};

  result.rows.forEach((row) => {
    const chainId = row.CHAIN_ID;

    if (!chains[chainId]) {
      chains[chainId] = [];
    }

    const blockData = {
      chainId: row.CHAIN_ID,
      seqNum: row.SEQUENCE_NUMBER,
      pollId: row.POLL_ID,
      pollTitle: row.POLL_TITLE,
      optionName: row.OPTION_NAME,
      votedAt: row.CREATION_TIME,
      blockchain: {
        instanceId: row.INSTANCE_ID,
        chainId: row.CHAIN_ID,
        sequenceNumber: row.SEQUENCE_NUMBER,
        creationTime: row.CREATION_TIME,
        userNumber: row.USER_NUMBER,
        blockHash: row.BLOCK_HASH ? "0x" + row.BLOCK_HASH : null,
        signatureAlgorithm: row.SIGNATURE_ALGORITHM,
        signature: row.SIGNATURE ? "0x" + row.SIGNATURE : null,
        spareData: row.SPARE_DATA ? "0x" + row.SPARE_DATA : null,
      },
    };

    // Calculate previous hash from previous block in same chain
    const chainBlocks = chains[chainId];
    if (chainBlocks.length > 0) {
      const previousBlock = chainBlocks[chainBlocks.length - 1];
      blockData.blockchain.previousHash = previousBlock.blockchain.blockHash;
    } else {
      blockData.blockchain.previousHash = "0x" + "0".repeat(128); // SHA2_512 = 64 bytes = 128 hex chars
    }

    chains[chainId].push(blockData);
  });

  // Flatten chains into single array with chain integrity info
  const blocks = [];
  Object.entries(chains).forEach(([chainId, chainBlocks]) => {
    chainBlocks.forEach((block, index) => {
      blocks.push({
        ...block,
        chainInfo: {
          chainId: parseInt(chainId),
          position: index + 1,
          totalInChain: chainBlocks.length,
          isFirstBlock: index === 0,
          isValid: true,
        },
      });
    });
  });

  return {
    totalBlocks: blocks.length,
    totalChains: Object.keys(chains).length,
    blocks,
    chainsSummary: Object.entries(chains).map(([chainId, chainBlocks]) => ({
      chainId: parseInt(chainId),
      blockCount: chainBlocks.length,
      firstBlock: chainBlocks[0]?.blockchain.sequenceNumber,
      lastBlock: chainBlocks[chainBlocks.length - 1]?.blockchain.sequenceNumber,
      firstTimestamp: chainBlocks[0]?.blockchain.creationTime,
      lastTimestamp:
        chainBlocks[chainBlocks.length - 1]?.blockchain.creationTime,
    })),
  };
};

/**
 * Get transaction by composite key (chainId + seqNum)
 */
export const getTransactionById = async (chainId, seqNum) => {
  const sql = `
    SELECT
      poll_id,
      option_id,
      vote_timestamp,
      poll_title,
      option_name,
      ORABCTAB_INST_ID$,
      ORABCTAB_CHAIN_ID$,
      ORABCTAB_SEQ_NUM$,
      ORABCTAB_CREATION_TIME$,
      RAWTOHEX(ORABCTAB_HASH$) as hash_hex
    FROM ${VOTES_TABLE}
    WHERE ORABCTAB_CHAIN_ID$ = :chainId
      AND ORABCTAB_SEQ_NUM$ = :seqNum
  `;

  const result = await executeQuery(sql, { chainId, seqNum });

  if (result.rows.length === 0) {
    throw new Error("Transaction not found");
  }

  const tx = result.rows[0];

  // Get previous hash
  let previousHash = "0x" + "0".repeat(128);

  if (tx.ORABCTAB_SEQ_NUM$ > 1) {
    const prevSql = `
      SELECT RAWTOHEX(ORABCTAB_HASH$) as hash_hex
      FROM ${VOTES_TABLE}
      WHERE ORABCTAB_CHAIN_ID$ = :chainId
        AND ORABCTAB_SEQ_NUM$ = :prevSeq
    `;
    const prevResult = await executeQuery(prevSql, {
      chainId: tx.ORABCTAB_CHAIN_ID$,
      prevSeq: tx.ORABCTAB_SEQ_NUM$ - 1,
    });

    if (prevResult.rows.length > 0) {
      previousHash = "0x" + prevResult.rows[0].HASH_HEX;
    }
  }

  return {
    action: "vote",
    pollId: tx.POLL_ID,
    pollTitle: tx.POLL_TITLE,
    optionId: tx.OPTION_ID,
    optionName: tx.OPTION_NAME,
    timestamp: tx.VOTE_TIMESTAMP,
    hash: "0x" + tx.HASH_HEX,
    previousHash,
    chainSequence: tx.ORABCTAB_SEQ_NUM$,
    chainId: tx.ORABCTAB_CHAIN_ID$,
    creationTime: tx.ORABCTAB_CREATION_TIME$,
  };
};

/**
 * Get blockchain chain details
 */
export const getChainDetails = async (chainId) => {
  const sql = `
    SELECT
      poll_title,
      option_name,
      ORABCTAB_CHAIN_ID$ as chain_id,
      ORABCTAB_SEQ_NUM$ as sequence_number,
      ORABCTAB_CREATION_TIME$ as creation_time,
      RAWTOHEX(ORABCTAB_HASH$) as block_hash
    FROM ${VOTES_TABLE}
    WHERE ORABCTAB_CHAIN_ID$ = :chainId
    ORDER BY ORABCTAB_SEQ_NUM$
  `;

  const result = await executeQuery(sql, { chainId });

  const blocks = result.rows.map((row, index, array) => ({
    chainId: row.CHAIN_ID,
    seqNum: row.SEQUENCE_NUMBER,
    pollTitle: row.POLL_TITLE,
    optionName: row.OPTION_NAME,
    sequenceNumber: row.SEQUENCE_NUMBER,
    creationTime: row.CREATION_TIME,
    blockHash: "0x" + row.BLOCK_HASH,
    previousHash:
      index > 0 ? "0x" + array[index - 1].BLOCK_HASH : "0x" + "0".repeat(128),
  }));

  return {
    chainId,
    blockCount: blocks.length,
    blocks,
  };
};

/**
 * Verify blockchain integrity (custom verification)
 * Optimized to fetch all blocks in a single query
 */
export const verifyBlockchainIntegrity = async () => {
  try {
    // Get all blocks from all chains in one query
    const blocksSql = `
      SELECT
        ORABCTAB_CHAIN_ID$ as chain_id,
        ORABCTAB_SEQ_NUM$ as seq_num,
        RAWTOHEX(ORABCTAB_HASH$) as block_hash,
        ORABCTAB_CREATION_TIME$ as creation_time
      FROM ${VOTES_TABLE}
      ORDER BY ORABCTAB_CHAIN_ID$, ORABCTAB_SEQ_NUM$
    `;

    const blocksResult = await executeQuery(blocksSql);

    // Group blocks by chain
    const chainBlocks = {};
    blocksResult.rows.forEach((block) => {
      const chainId = block.CHAIN_ID;
      if (!chainBlocks[chainId]) {
        chainBlocks[chainId] = [];
      }
      chainBlocks[chainId].push(block);
    });

    const verificationResults = [];
    let totalBlocks = 0;

    // Verify each chain
    Object.entries(chainBlocks).forEach(([chainId, blocks]) => {
      totalBlocks += blocks.length;

      // Verify sequence numbers are continuous
      let isValid = true;
      let issues = [];

      for (let i = 0; i < blocks.length; i++) {
        const expectedSeq = i + 1;
        const actualSeq = blocks[i].SEQ_NUM;

        if (actualSeq !== expectedSeq) {
          isValid = false;
          issues.push(
            `Sequence gap: expected ${expectedSeq}, got ${actualSeq}`,
          );
        }
      }

      // Verify timestamps are in order
      for (let i = 1; i < blocks.length; i++) {
        const prevTime = new Date(blocks[i - 1].CREATION_TIME);
        const currTime = new Date(blocks[i].CREATION_TIME);

        if (currTime < prevTime) {
          isValid = false;
          issues.push(`Timestamp out of order at seq ${blocks[i].SEQ_NUM}`);
        }
      }

      verificationResults.push({
        chainId: parseInt(chainId),
        blockCount: blocks.length,
        isValid,
        issues,
        firstBlock: blocks[0]
          ? {
              chainId: blocks[0].CHAIN_ID,
              seqNum: blocks[0].SEQ_NUM,
              hash: "0x" + blocks[0].BLOCK_HASH.substring(0, 16) + "...",
            }
          : null,
        lastBlock: blocks[blocks.length - 1]
          ? {
              chainId: blocks[blocks.length - 1].CHAIN_ID,
              seqNum: blocks[blocks.length - 1].SEQ_NUM,
              hash:
                "0x" +
                blocks[blocks.length - 1].BLOCK_HASH.substring(0, 16) +
                "...",
            }
          : null,
      });
    });

    const overallValid = verificationResults.every((r) => r.isValid);

    return {
      isValid: overallValid,
      verificationMethod: "Custom sequence and timestamp verification",
      totalChains: verificationResults.length,
      totalBlocks: totalBlocks,
      chains: verificationResults,
      summary: {
        validChains: verificationResults.filter((r) => r.isValid).length,
        invalidChains: verificationResults.filter((r) => !r.isValid).length,
        totalIssues: verificationResults.reduce(
          (sum, r) => sum + r.issues.length,
          0,
        ),
      },
      message: overallValid
        ? "✓ All blockchain chains are valid"
        : "⚠ Some chains have integrity issues",
    };
  } catch (error) {
    console.error("Blockchain verification error:", error);
    return {
      isValid: false,
      error: error.message,
      message: "x Blockchain integrity verification failed",
    };
  }
};

/**
 * Get blockchain metadata
 */
export const getBlockchainMetadata = async () => {
  const sql = `
    SELECT
      table_name,
      row_retention,
      row_retention_locked,
      hash_algorithm
    FROM USER_BLOCKCHAIN_TABLES
    WHERE table_name = '${VOTES_TABLE}'
  `;

  const result = await executeQuery(sql);

  if (result.rows.length === 0) {
    throw new Error("Blockchain table not found");
  }

  const metadata = result.rows[0];

  // Get total transactions
  const countSql = `SELECT COUNT(*) as total FROM ${VOTES_TABLE}`;
  const countResult = await executeQuery(countSql);

  // Get chain statistics
  const statsSql = `
    SELECT
      MIN(ORABCTAB_SEQ_NUM$) as min_sequence,
      MAX(ORABCTAB_SEQ_NUM$) as max_sequence,
      COUNT(DISTINCT ORABCTAB_CHAIN_ID$) as chain_count
    FROM ${VOTES_TABLE}
  `;
  const statsResult = await executeQuery(statsSql);

  return {
    tableName: metadata.TABLE_NAME,
    rowRetention: metadata.ROW_RETENTION,
    rowRetentionLocked: metadata.ROW_RETENTION_LOCKED === "YES",
    hashAlgorithm: metadata.HASH_ALGORITHM,
    totalTransactions: countResult.rows[0].TOTAL,
    minSequence: statsResult.rows[0].MIN_SEQUENCE || 0,
    maxSequence: statsResult.rows[0].MAX_SEQUENCE || 0,
    chainCount: statsResult.rows[0].CHAIN_COUNT || 0,
  };
};

/**
 * Get transaction statistics
 */
export const getTransactionStatistics = async () => {
  const totalSql = `SELECT COUNT(*) as total FROM ${VOTES_TABLE}`;
  const totalResult = await executeQuery(totalSql);

  const todaySql = `
    SELECT COUNT(*) as today_total
    FROM ${VOTES_TABLE}
    WHERE TRUNC(vote_timestamp) = TRUNC(SYSDATE)
  `;
  const todayResult = await executeQuery(todaySql);

  const pollsSql = `
    SELECT
      poll_id,
      poll_title,
      COUNT(*) as vote_count
    FROM ${VOTES_TABLE}
    GROUP BY poll_id, poll_title
    ORDER BY vote_count DESC
  `;
  const pollsResult = await executeQuery(pollsSql);

  // Get blockchain stats
  const statsSql = `
    SELECT
      COUNT(*) as total_blocks,
      COUNT(DISTINCT ORABCTAB_CHAIN_ID$) as total_chains,
      MIN(ORABCTAB_SEQ_NUM$) as min_sequence,
      MAX(ORABCTAB_SEQ_NUM$) as max_sequence,
      MIN(ORABCTAB_CREATION_TIME$) as first_block_time,
      MAX(ORABCTAB_CREATION_TIME$) as last_block_time
    FROM ${VOTES_TABLE}
  `;
  const statsResult = await executeQuery(statsSql);
  const stats = statsResult.rows[0];

  return {
    totalTransactions: totalResult.rows[0].TOTAL,
    todayTransactions: todayResult.rows[0].TODAY_TOTAL,
    pollStatistics: pollsResult.rows.map((row) => ({
      pollId: row.POLL_ID,
      pollTitle: row.POLL_TITLE,
      voteCount: row.VOTE_COUNT,
    })),
    blockchainStats: {
      totalBlocks: stats.TOTAL_BLOCKS,
      totalChains: stats.TOTAL_CHAINS,
      minSequence: stats.MIN_SEQUENCE,
      maxSequence: stats.MAX_SEQUENCE,
      firstBlockTime: stats.FIRST_BLOCK_TIME,
      lastBlockTime: stats.LAST_BLOCK_TIME,
    },
  };
};

export default {
  getAllTransactions,
  getDetailedTransactionAnalysis,
  getTransactionById,
  getChainDetails,
  verifyBlockchainIntegrity,
  getBlockchainMetadata,
  getTransactionStatistics,
};

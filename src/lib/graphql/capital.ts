// Query to get user claim events from PoolInteractions
// Since User.claimed may not exist in the current subgraph, we'll sum claim events
export const GET_USER_ALL_CLAIM_EVENTS = `
  query GetUserAllClaimEvents($userAddress: Bytes!) {
    poolInteractions(
      where: {
        user_: { address: $userAddress }
        type: 2  # Claim events
        depositPool_in: [
          "0x47176B2Af9885dC6C4575d4eFd63895f7Aaa4790",  # stETH
          "0xdE283F8309Fd1AA46c95d299f6B8310716277A42",  # wBTC
          "0x9380d72aBbD6e0Cc45095A2Ef8c2CA87d77Cb384",  # wETH
          "0x6cCE082851Add4c535352f596662521B4De4750E",  # USDC
          "0x3B51989212BEdaB926794D6bf8e9E991218cf116"   # USDT
        ]
      }
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      amount
      blockTimestamp
      blockNumber
      transactionHash
      type
      user {
        address
        rewardPoolId
      }
      depositPool
      totalStaked
      rate
    }
  }
`;

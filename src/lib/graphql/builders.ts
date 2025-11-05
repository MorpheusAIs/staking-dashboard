export const GET_BUILDERS_PROJECT_USERS = `
  query getBuildersProjectUsers(
    $first: Int = 50
    $skip: Int = 0
    $buildersProjectId: Bytes = ""
    $orderBy: String = "staked"
    $orderDirection: String = "desc"
  ) {
    buildersUsers(
      first: $first
      skip: $skip
      where: { buildersProject_: {id: $buildersProjectId} }
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      address
      id
      staked
      lastStake
    }
  }
`;

// New query to get builder subnet users for testnet
export const GET_BUILDER_SUBNET_USERS = `
  query getBuilderSubnetUsers(
    $first: Int = 50
    $skip: Int = 0
    $builderSubnetId: Bytes = ""
    $orderBy: String = "staked"
    $orderDirection: String = "desc"
  ) {
    builderUsers(
      first: $first
      skip: $skip
      where: { builderSubnet_: {id: $builderSubnetId} }
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      address
      id
      staked
      lastStake
      claimed
      claimLockEnd
    }
  }
`;

export const GET_BUILDERS_PROJECT_BY_ID = `
  query getBuildersProjectById($id: ID = "") {
    buildersProject(id: $id) {
      claimLockEnd
      minimalDeposit
      name
      totalClaimed
      totalStaked
      totalUsers
      withdrawLockPeriodAfterDeposit
    }
  }
`;

export const GET_BUILDERS_PROJECT_BY_ID_TESTNET = `
  query getBuildersProjectByIdTestnet($id: ID!) {
    builderSubnet(id: $id) {
      withdrawLockPeriodAfterStake
      totalStaked
      totalClaimed
      totalUsers
    }
  }
`;

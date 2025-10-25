import { Container } from "@chakra-ui/react";
import { SubnetStaking } from "staking-dashboard/containers/SubnetStaking";

export default function SubnetPage() {
  return (
    <Container maxW="3xl" width="full">
      <SubnetStaking />
    </Container>
  );
}

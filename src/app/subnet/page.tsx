import { Container } from "@chakra-ui/react";
import { SubnetStaking } from "staking-dashboard/containers/SubnetStaking";

export default function SubnetPage() {
  return (
    <Container maxW="4xl" width="full">
      <SubnetStaking />
    </Container>
  );
}

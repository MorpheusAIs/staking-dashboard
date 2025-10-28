import { Container } from "@chakra-ui/react";
import { SubnetStaking } from "staking-dashboard/containers/SubnetStaking";

export default function SubnetPage() {
  return (
    <Container pt={6} maxW="container.xl">
      <SubnetStaking />
    </Container>
  );
}

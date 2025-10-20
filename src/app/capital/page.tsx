import { Container } from "@chakra-ui/react";
import { CapitalStaking } from "staking-dashboard/containers/CapitalStaking";
export default function CapitalPage() {
  return (
    <Container pt={6} maxW="container.xl">
      <CapitalStaking />
    </Container>
  );
}

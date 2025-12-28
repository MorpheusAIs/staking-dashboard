"use client";
import { Box, Skeleton, Table } from "@chakra-ui/react";

export type LoadingTableProps = {
  columns?: number;
  rows?: number;
};

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const LoadingTable: React.FC<LoadingTableProps> = (args) => {
  const { columns = 4, rows = 6 } = args;

  // =============== VIEWS
  return (
    <Box
      w="full"
      borderRadius="sm"
      border="1px solid"
      borderColor="border"
      bg="card"
      overflowX="auto"
    >
      <Table.ScrollArea>
        <Table.Root size="md" variant="outline">
          <Table.Header bg="card">
            <Table.Row>
              {Array.from({ length: columns }).map((col, i) => (
                <Table.ColumnHeader key={i}>
                  <Skeleton height="20px" w="80%" />
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {Array.from({ length: rows }).map((_, r) => (
              <Table.Row key={r}>
                {Array.from({ length: columns }).map((_, i) => (
                  <Table.Cell key={i} textAlign={"center"} py={3}>
                    <Skeleton height="18px" />
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Box>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default LoadingTable;

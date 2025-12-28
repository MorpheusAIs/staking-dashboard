"use client";

import { Box, Table } from "@chakra-ui/react";
import { UserAsset } from "staking-dashboard/containers/CapitalStaking/type";
import LoadingTable from "../LoadingTable";

export type DataTableProps = {
  data: UserAsset[];
  columns: ColumnsType[];
  isLoading: boolean;
};

export type ColumnsType = {
  id: string;
  header: string;
  renderCell: (data: UserAsset) => React.ReactNode;
};

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const DataTable: React.FC<DataTableProps> = (props) => {
  const { data, columns, isLoading } = props;

  // =============== RENDER FUNCTIONS
  const renderTableBody = () => {
    return (
      <Table.Body>
        {data.map((assetData) => (
          <Table.Row key={assetData.id}>
            {columns.map((item) => (
              <Table.Cell key={item.id} textAlign={"center"} py={3}>
                {item?.renderCell(assetData)}
              </Table.Cell>
            ))}
          </Table.Row>
        ))}
      </Table.Body>
    );
  };

  // =============== VIEWS
  if (isLoading) return <LoadingTable rows={3} />;
  return (
    <Box
      w="full"
      borderRadius="sm"
      border="1px solid"
      borderColor="border"
      bg="card"
      overflowX="auto"
    >
      <Table.ScrollArea maxHeight={"220px"}>
        <Table.Root size="md" variant="outline">
          <Table.Header bg="card">
            <Table.Row>
              {columns.map((item) => (
                <Table.ColumnHeader key={item.id}>
                  {item.header}
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          {renderTableBody()}
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
export default DataTable;

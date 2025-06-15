
import React from "react";
import PurchaseItemRow from "./PurchaseItemRow";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PurchaseItemsTableProps {
  items: any[];
  products: any[];
  unitsMap: Record<string, any>;
  productConversions: Record<string, any[]>;
  searchModalOpenIdx: number | null;
  onUpdateItem: (index: number, field: string, value: any) => void;
  onRemoveItem: (index: number) => void;
  onOpenSearchModal: (index: number) => void;
  onSelectProduct: (product: any, rowIdx: number) => void;
}

const PurchaseItemsTable: React.FC<PurchaseItemsTableProps> = ({
  items,
  products,
  unitsMap,
  productConversions,
  searchModalOpenIdx,
  onUpdateItem,
  onRemoveItem,
  onOpenSearchModal,
  onSelectProduct,
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produk</TableHead>
          <TableHead>Jumlah</TableHead>
          <TableHead>Unit Pembelian</TableHead>
          <TableHead>Harga Satuan</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Konversi</TableHead>
          <TableHead>Tanggal Kedaluwarsa</TableHead>
          <TableHead>Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, index) => {
          const selectedProduct = products?.find((p) => p.id === item.product_id);
          const baseUnitId = selectedProduct?.unit_id;

          // Find allowed units for this product.
          let allowedUnits: string[] = [];
          if (baseUnitId) allowedUnits.push(baseUnitId);
          if (productConversions[item.product_id]) {
            productConversions[item.product_id].forEach((conv: any) => {
              if (conv.from_unit_id && !allowedUnits.includes(conv.from_unit_id))
                allowedUnits.push(conv.from_unit_id);
              if (conv.to_unit_id && !allowedUnits.includes(conv.to_unit_id))
                allowedUnits.push(conv.to_unit_id);
            });
          }
          allowedUnits = allowedUnits.filter(Boolean);

          return (
            <PurchaseItemRow
              key={index}
              index={index}
              item={item}
              products={products}
              unitsMap={unitsMap}
              allowedUnits={allowedUnits}
              productConversions={productConversions}
              onUpdate={onUpdateItem}
              onRemove={onRemoveItem}
              openProductModal={onOpenSearchModal}
              isModalOpen={searchModalOpenIdx === index}
              onProductSelected={onSelectProduct}
              baseUnitId={baseUnitId}
            />
          );
        })}
      </TableBody>
    </Table>
  );
};

export default PurchaseItemsTable;

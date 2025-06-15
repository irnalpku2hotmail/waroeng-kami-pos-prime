
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Search } from "lucide-react";
import ProductSearchModal from "@/components/ProductSearchModal";

type Unit = { id: string; name: string; abbreviation: string };
type Item = {
  product_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  expiration_date?: string;
  purchase_unit_id: string;
  conversion_factor: number;
};

interface PurchaseItemRowProps {
  index: number;
  item: Item;
  products: any[];
  unitsMap: Record<string, Unit>;
  allowedUnits: string[];
  productConversions: Record<string, any[]>;
  onUpdate: (i: number, field: string, value: any) => void;
  onRemove: (i: number) => void;
  openProductModal: (i: number) => void;
  isModalOpen: boolean;
  onProductSelected: (prod: any, i: number) => void;
  baseUnitId?: string;
}

const PurchaseItemRow: React.FC<PurchaseItemRowProps> = ({
  index,
  item,
  products,
  unitsMap,
  allowedUnits,
  productConversions,
  onUpdate,
  onRemove,
  openProductModal,
  isModalOpen,
  onProductSelected,
  baseUnitId
}) => {
  const selectedProduct = products?.find((p) => p.id === item.product_id);
  return (
    <tr>
      <td>
        <div className="flex gap-2 items-center">
          {selectedProduct ? (
            <>
              <span className="font-medium text-sm">{selectedProduct.name}</span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => openProductModal(index)}
                title="Ganti Produk"
              >
                <Search className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openProductModal(index)}
            >
              <Search className="h-4 w-4 mr-2" />
              Pilih Produk
            </Button>
          )}
        </div>
        {isModalOpen && (
          <ProductSearchModal
            open={true}
            onOpenChange={(open) => {
              if (!open) openProductModal(-1);
            }}
            onSelectProduct={(product) => onProductSelected(product, index)}
          />
        )}
      </td>
      <td>
        <Input
          type="number"
          value={item.quantity}
          onChange={(e) => onUpdate(index, "quantity", Number(e.target.value))}
          min="1"
        />
      </td>
      <td>
        <Select
          value={item.purchase_unit_id}
          onValueChange={(value) => onUpdate(index, "purchase_unit_id", value)}
          disabled={!item.product_id}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih unit" />
          </SelectTrigger>
          <SelectContent>
            {allowedUnits.map((uid) =>
              unitsMap[uid] ? (
                <SelectItem value={uid} key={uid}>
                  {unitsMap[uid]?.name} ({unitsMap[uid]?.abbreviation})
                  {uid === baseUnitId && " (Dasar)"}
                </SelectItem>
              ) : null
            )}
          </SelectContent>
        </Select>
      </td>
      <td>
        <Input
          type="number"
          value={item.unit_cost}
          onChange={(e) => onUpdate(index, "unit_cost", Number(e.target.value))}
          min="0"
        />
      </td>
      <td>
        Rp {item.total_cost?.toLocaleString("id-ID") || 0}
      </td>
      <td>
        <span title={item.conversion_factor}>
          x{Number(item.conversion_factor).toLocaleString("id-ID", { maximumFractionDigits: 6 })}
        </span>
      </td>
      <td>
        <Input
          type="date"
          value={item.expiration_date}
          onChange={(e) => onUpdate(index, "expiration_date", e.target.value)}
        />
      </td>
      <td>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
};

export default PurchaseItemRow;

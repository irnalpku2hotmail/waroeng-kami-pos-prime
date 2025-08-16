
interface OrderStockStatusProps {
  orderItems: any[];
  orderStatus: string;
}

const OrderStockStatus = ({ orderItems, orderStatus }: OrderStockStatusProps) => {
  const getStockStatus = (currentStock: number, orderQuantity: number, minStock: number, orderStatus: string) => {
    let availableStock = currentStock;
    let stockText = '';
    let colorClass = '';
    
    // If order is not delivered yet, the stock is still committed
    if (orderStatus !== 'delivered' && orderStatus !== 'cancelled') {
      availableStock = currentStock; // Current stock already reflects pending orders
      stockText = `${currentStock} tersedia`;
    } else {
      stockText = `${currentStock} tersedia`;
    }
    
    // Determine color based on stock level
    if (currentStock <= minStock) {
      colorClass = 'text-red-600 font-semibold bg-red-50 px-2 py-1 rounded';
    } else if (currentStock <= minStock * 2) {
      colorClass = 'text-yellow-600 font-semibold bg-yellow-50 px-2 py-1 rounded';
    } else {
      colorClass = 'text-green-600 font-semibold bg-green-50 px-2 py-1 rounded';
    }
    
    return { stockText, colorClass, availableStock };
  };

  return (
    <div className="space-y-1">
      {orderItems?.map((item: any) => {
        const stockInfo = getStockStatus(
          item.products?.current_stock || 0,
          item.quantity,
          item.products?.min_stock || 0,
          orderStatus
        );
        return (
          <div key={item.id} className="text-xs">
            <div className="font-medium text-gray-700">{item.products?.name}</div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Pesan: {item.quantity}</span>
              <span className={stockInfo.colorClass}>
                {stockInfo.stockText}
              </span>
            </div>
            {stockInfo.availableStock < item.quantity && orderStatus !== 'delivered' && orderStatus !== 'cancelled' && (
              <div className="text-red-600 font-medium">
                ⚠️ Stok tidak mencukupi
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OrderStockStatus;

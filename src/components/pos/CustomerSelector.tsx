
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CustomerSelectorProps {
  customers: any[];
  selectedCustomer: any;
  setSelectedCustomer: (customer: any | null) => void;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({ customers, selectedCustomer, setSelectedCustomer }) => {
  return (
    <div>
      <label className="text-sm font-medium">Customer (Opsional)</label>
      <Select value={selectedCustomer?.id || 'no-customer'} onValueChange={(value) => {
        if (value === 'no-customer') {
          setSelectedCustomer(null);
        } else {
          const customer = customers.find(c => c.id === value);
          setSelectedCustomer(customer || null);
        }
      }}>
        <SelectTrigger>
          <SelectValue placeholder="Pilih customer" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="no-customer">Tanpa Customer</SelectItem>
          {customers.map(customer => (
            <SelectItem key={customer.id} value={customer.id}>
              {customer.name} - {customer.total_points} pts
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CustomerSelector;

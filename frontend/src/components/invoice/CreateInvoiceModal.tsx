import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import { useToast } from '../ui/use-toast';

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price_cents: number;
  tax_rate?: number;
  discount_percentage?: number;
}

interface CreateInvoiceModalProps {
  trigger?: React.ReactNode;
  clients: Array<{ id: string; name: string }>;
  coachId: string;
  onSuccess?: () => void;
}

const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  trigger,
  clients,
  coachId,
  onSuccess
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    client_id: '',
    due_date: '',
    payment_terms: 'Net 30',
    notes: '',
    terms_and_conditions: '',
    tax_rate: 0,
    discount_cents: 0,
    send_immediately: false
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      description: '',
      quantity: 1,
      unit_price_cents: 0,
      tax_rate: 0,
      discount_percentage: 0
    }
  ]);

  // Set default due date to 30 days from now
  useEffect(() => {
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 30);
    setFormData(prev => ({
      ...prev,
      due_date: defaultDueDate.toISOString().split('T')[0]
    }));
  }, []);

  const addItem = () => {
    setItems([...items, {
      description: '',
      quantity: 1,
      unit_price_cents: 0,
      tax_rate: 0,
      discount_percentage: 0
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((total, item) => {
      const itemTotal = item.quantity * item.unit_price_cents;
      const discount = item.discount_percentage ? itemTotal * item.discount_percentage / 100 : 0;
      return total + itemTotal - discount;
    }, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return Math.round(subtotal * formData.tax_rate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - formData.discount_cents;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          coach_id: coachId,
          items: items.map(item => ({
            ...item,
            unit_price_cents: Math.round(item.unit_price_cents * 100) // Convert to cents
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create invoice');
      }

      toast({
        title: 'Success',
        description: 'Invoice created successfully'
      });

      setOpen(false);
      onSuccess?.();

      // Reset form
      setFormData({
        client_id: '',
        due_date: '',
        payment_terms: 'Net 30',
        notes: '',
        terms_and_conditions: '',
        tax_rate: 0,
        discount_cents: 0,
        send_immediately: false
      });
      setItems([{
        description: '',
        quantity: 1,
        unit_price_cents: 0,
        tax_rate: 0,
        discount_percentage: 0
      }]);

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create invoice',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">Client</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="payment_terms">Payment Terms</Label>
            <Select
              value={formData.payment_terms}
              onValueChange={(value) => setFormData({ ...formData, payment_terms: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Due on receipt">Due on receipt</SelectItem>
                <SelectItem value="Net 15">Net 15</SelectItem>
                <SelectItem value="Net 30">Net 30</SelectItem>
                <SelectItem value="Net 60">Net 60</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Invoice Items
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end p-4 border rounded-lg">
                  <div className="col-span-4">
                    <Label>Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Service description"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Unit Price</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price_cents / 100}
                        onChange={(e) => updateItem(index, 'unit_price_cents', Math.round(parseFloat(e.target.value || '0') * 100))}
                        className="pl-10"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <Label>Discount %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={item.discount_percentage || ''}
                      onChange={(e) => updateItem(index, 'discount_percentage', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>

                  <div className="col-span-1">
                    <Label>Total</Label>
                    <p className="text-sm font-medium p-2">
                      {formatCurrency(
                        item.quantity * item.unit_price_cents * (1 - (item.discount_percentage || 0) / 100)
                      )}
                    </p>
                  </div>

                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Totals and Settings */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label htmlFor="discount">Invoice Discount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount_cents / 100}
                    onChange={(e) => setFormData({ ...formData, discount_cents: Math.round(parseFloat(e.target.value || '0') * 100) })}
                    className="pl-10"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="send_immediately"
                  checked={formData.send_immediately}
                  onChange={(e) => setFormData({ ...formData, send_immediately: e.target.checked })}
                />
                <Label htmlFor="send_immediately">Send immediately</Label>
              </div>
            </div>

            <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold">Invoice Total</h3>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(calculateSubtotal())}</span>
              </div>
              {formData.tax_rate > 0 && (
                <div className="flex justify-between">
                  <span>Tax ({formData.tax_rate}%):</span>
                  <span>{formatCurrency(calculateTax())}</span>
                </div>
              )}
              {formData.discount_cents > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-{formatCurrency(formData.discount_cents)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes for the client"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="terms">Terms & Conditions</Label>
            <Textarea
              id="terms"
              value={formData.terms_and_conditions}
              onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
              placeholder="Terms and conditions"
              rows={3}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInvoiceModal;
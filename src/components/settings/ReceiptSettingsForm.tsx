
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UseMutationResult } from '@tanstack/react-query';
import { Label } from '../ui/label';

const formSchema = z.object({
  header_text: z.string().optional(),
  footer_text: z.string().optional(),
  paper_size: z.enum(['58mm', '80mm']),
  show_logo: z.boolean(),
  show_cashier: z.boolean(),
  show_qr_code: z.boolean(),
});

type ReceiptSettingsFormValues = z.infer<typeof formSchema>;

interface ReceiptSettingsFormProps {
  settings: Record<string, any> | undefined;
  updateSettings: UseMutationResult<void, Error, Record<string, any>, unknown>;
}

const ReceiptSettingsForm = ({ settings, updateSettings }: ReceiptSettingsFormProps) => {
  const form = useForm<ReceiptSettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      header_text: '',
      footer_text: '',
      paper_size: '80mm',
      show_logo: false,
      show_cashier: true,
      show_qr_code: true,
    },
  });

  useEffect(() => {
    if (settings?.receipt_settings) {
      const { receipt_settings } = settings;
      form.reset({
        header_text: receipt_settings.header_text || '',
        footer_text: receipt_settings.footer_text || '',
        paper_size: receipt_settings.paper_size || '80mm',
        show_logo: receipt_settings.show_logo || false,
        show_cashier: receipt_settings.show_cashier ?? true,
        show_qr_code: receipt_settings.show_qr_code ?? true,
      });
    }
  }, [settings, form]);

  const onSubmit = (values: ReceiptSettingsFormValues) => {
    const receiptData = {
      receipt_settings: values,
    };
    updateSettings.mutate(receiptData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Struk</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="header_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teks Header Struk</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Terima kasih telah berbelanja di toko kami" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="footer_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teks Footer Struk</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Barang yang sudah dibeli tidak dapat dikembalikan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paper_size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ukuran Kertas</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih ukuran kertas" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="58mm">58mm</SelectItem>
                      <SelectItem value="80mm">80mm</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="show_logo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Tampilkan Logo</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="show_cashier"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Tampilkan Nama Kasir</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="show_qr_code"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Tampilkan QR Code (Nomor Transaksi)</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? 'Menyimpan...' : 'Simpan Pengaturan Struk'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ReceiptSettingsForm;

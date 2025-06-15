
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UseMutationResult } from '@tanstack/react-query';

const formSchema = z.object({
  store_name: z.string().min(1, 'Nama toko tidak boleh kosong'),
  store_address: z.string().min(1, 'Alamat toko tidak boleh kosong'),
  store_phone: z.string().min(1, 'Nomor telepon tidak boleh kosong'),
  store_email: z.string().email('Format email tidak valid'),
});

type StoreInfoFormValues = z.infer<typeof formSchema>;

interface StoreInfoFormProps {
  settings: Record<string, any> | undefined;
  updateSettings: UseMutationResult<void, Error, Record<string, any>, unknown>;
}

const StoreInfoForm = ({ settings, updateSettings }: StoreInfoFormProps) => {
  const form = useForm<StoreInfoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      store_name: '',
      store_address: '',
      store_phone: '',
      store_email: '',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        store_name: settings.store_name?.name || '',
        store_address: settings.store_address?.address || '',
        store_phone: settings.store_phone?.phone || '',
        store_email: settings.store_email?.email || '',
      });
    }
  }, [settings, form]);

  const onSubmit = (values: StoreInfoFormValues) => {
    const storeData = {
      store_name: { name: values.store_name },
      store_address: { address: values.store_address },
      store_phone: { phone: values.store_phone },
      store_email: { email: values.store_email },
    };
    updateSettings.mutate(storeData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informasi Toko</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="store_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Toko</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama toko Anda" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="store_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Alamat lengkap toko" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="store_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telepon</FormLabel>
                    <FormControl>
                      <Input placeholder="+62 xxx xxx xxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="store_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@toko.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? 'Menyimpan...' : 'Simpan Informasi'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default StoreInfoForm;

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const SearchAnalytics = () => {
  const [dateFilter, setDateFilter] = useState('7');

  // All aggregation (totals, top keywords, zero-result keywords) is computed
  // in Postgres; the browser downloads a tiny JSON summary instead of every row.
  const { data: summary } = useQuery({
    queryKey: ['search-analytics-summary', dateFilter],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_search_analytics_summary', {
        p_days: parseInt(dateFilter, 10),
      });
      if (error) throw error;
      return data as {
        total_searches: number;
        unique_searches: number;
        no_results_count: number;
        top_searches: { query: string; count: number }[];
        no_result_searches: { query: string; count: number }[];
      };
    },
  });

  // Only the 20 most recent rows are fetched for the history table.
  const { data: recentSearches = [], isLoading } = useQuery({
    queryKey: ['search-analytics-recent', dateFilter],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateFilter, 10));
      const { data, error } = await supabase
        .from('search_analytics')
        .select('id, search_query, category_filter, results_count, created_at')
        .gte('created_at', daysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  const topSearchesList = summary?.top_searches || [];
  const noResultsList = summary?.no_result_searches || [];
  const totalSearches = summary?.total_searches || 0;
  const uniqueSearches = summary?.unique_searches || 0;
  const noResultsCount = summary?.no_results_count || 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analitik Pencarian</h1>
            <p className="text-gray-500 mt-1">Pantau perilaku pencarian pelanggan</p>
          </div>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="7">7 Hari Terakhir</option>
            <option value="30">30 Hari Terakhir</option>
            <option value="90">90 Hari Terakhir</option>
          </select>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pencarian</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSearches}</div>
              <p className="text-xs text-muted-foreground">
                Semua pencarian dalam periode
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kata Kunci Unik</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueSearches}</div>
              <p className="text-xs text-muted-foreground">
                Berbeda kata kunci dicari
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tanpa Hasil</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{noResultsCount}</div>
              <p className="text-xs text-muted-foreground">
                Pencarian tanpa hasil
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Searches */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Kata Kunci Terpopuler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kata Kunci</TableHead>
                    <TableHead className="text-right">Frekuensi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topSearchesList.length > 0 ? (
                    topSearchesList.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.query}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{item.count}x</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-gray-500">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* No Results Searches */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Pencarian Tanpa Hasil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kata Kunci</TableHead>
                    <TableHead className="text-right">Frekuensi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {noResultsList.length > 0 ? (
                    noResultsList.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.query}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="destructive">{item.count}x</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-gray-500">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Recent Search History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Riwayat Pencarian Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Kata Kunci</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Hasil</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : recentSearches.length > 0 ? (
                  recentSearches.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {format(new Date(item.created_at), 'dd MMM yyyy HH:mm', { locale: idLocale })}
                      </TableCell>
                      <TableCell className="font-medium">{item.search_query}</TableCell>
                      <TableCell>
                        {item.category_filter ? (
                          <Badge variant="outline">{item.category_filter}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.results_count > 0 ? (
                          <Badge variant="secondary">{item.results_count}</Badge>
                        ) : (
                          <Badge variant="destructive">0</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      Tidak ada riwayat pencarian
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SearchAnalytics;

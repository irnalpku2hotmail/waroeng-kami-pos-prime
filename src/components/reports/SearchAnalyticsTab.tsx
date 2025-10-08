import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const SearchAnalyticsTab = () => {
  const [dateFilter, setDateFilter] = useState('7');

  // Fetch search history with user info
  const { data: searchHistory = [], isLoading } = useQuery({
    queryKey: ['search-analytics', dateFilter],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateFilter));

      const { data, error } = await supabase
        .from('search_analytics')
        .select('*')
        .gte('created_at', daysAgo.toISOString())
        .order('created_at', { ascending: false});

      if (error) throw error;

      // Fetch profiles separately if user_id exists
      const enrichedData = await Promise.all(
        (data || []).map(async (item) => {
          let categoryFilterText = null;
          
          // Handle category_filter - extract string value if it's an object
          if (item.category_filter && item.category_filter !== null) {
            if (typeof item.category_filter === 'object') {
              categoryFilterText = (item.category_filter as any).name || null;
            } else if (typeof item.category_filter === 'string') {
              categoryFilterText = item.category_filter;
            }
          }

          if (item.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', item.user_id)
              .maybeSingle();
            return { 
              ...item, 
              profile: profile || null,
              category_filter: categoryFilterText
            };
          }
          return { 
            ...item, 
            profile: null,
            category_filter: categoryFilterText
          };
        })
      );

      return enrichedData;
    }
  });

  // Calculate most searched keywords
  const topSearches = searchHistory.reduce((acc: Record<string, number>, item) => {
    const query = item.search_query.toLowerCase().trim();
    acc[query] = (acc[query] || 0) + 1;
    return acc;
  }, {});

  const topSearchesList = Object.entries(topSearches)
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Find searches with no results
  const noResultsSearches = searchHistory
    .filter(item => item.results_count === 0)
    .reduce((acc: Record<string, number>, item) => {
      const query = item.search_query.toLowerCase().trim();
      acc[query] = (acc[query] || 0) + 1;
      return acc;
    }, {});

  const noResultsList = Object.entries(noResultsSearches)
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const totalSearches = searchHistory.length;
  const uniqueSearches = Object.keys(topSearches).length;
  const noResultsCount = searchHistory.filter(item => item.results_count === 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
                <TableHead>User</TableHead>
                <TableHead>Kata Kunci</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Hasil</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : searchHistory.length > 0 ? (
                searchHistory.slice(0, 20).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {format(new Date(item.created_at), 'dd MMM yyyy HH:mm', { locale: idLocale })}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{item.profile?.full_name || 'Guest'}</div>
                        <div className="text-gray-500 text-xs">{item.profile?.email || '-'}</div>
                      </div>
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
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    Tidak ada riwayat pencarian
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SearchAnalyticsTab;

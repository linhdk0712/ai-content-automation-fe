import {
  List as ListIcon
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { userSettingsService, UserListOfValue } from '../../services/userSettings.service';
import styles from './ListOfValues.module.css';

// Predefined categories for content automation
const PREDEFINED_CATEGORIES = [
  { value: 'industry', label: 'Industry', description: 'Các ngành nghề và lĩnh vực kinh doanh' },
  { value: 'content_type', label: 'Content Type', description: 'Các loại nội dung (video, blog, social post, etc.)' },
  { value: 'language', label: 'Language', description: 'Ngôn ngữ cho nội dung' },
  { value: 'tone', label: 'Tone', description: 'Giọng điệu và phong cách viết' },
  { value: 'target_audience', label: 'Target Audience', description: 'Đối tượng mục tiêu' },
  { value: 'ai_provider', label: 'AI Provider', description: 'Các nhà cung cấp AI (OpenAI, Claude, etc.)' }
];

const ListOfValues: React.FC = () => {
  // List of Values state
  const [listOfValues, setListOfValues] = useState<UserListOfValue[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('industry');
  const [lovLoading, setLovLoading] = useState<boolean>(false);
  const [lovData, setLovData] = useState<Record<string, UserListOfValue[]>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  useEffect(() => {
    if (selectedCategory) {
      loadListOfValuesData();
    }
  }, [selectedCategory]);

  const loadListOfValuesData = async () => {
    if (!selectedCategory) return;
    
    setLovLoading(true);
    try {
      console.log('Loading list of values for category:', selectedCategory);
      const lovData = await userSettingsService.getUserListOfValues(selectedCategory);
      console.log('Loaded list of values:', lovData);
      setListOfValues(lovData);
    } catch (error) {
      console.error('Failed to load list of values:', error);
      setListOfValues([]);
    } finally {
      setLovLoading(false);
    }
  };

  const handleCategoryChange = async (category: string) => {
    console.log('Changing category to:', category);
    setSelectedCategory(category);
    
    // Check if we already have data for this category
    if (lovData[category]) {
      setListOfValues(lovData[category]);
      return;
    }
    
    setLovLoading(true);
    try {
      const categoryData = await userSettingsService.getUserListOfValues(category);
      console.log('Loaded data for category', category, ':', categoryData);
      setListOfValues(categoryData);
      setLovData(prev => ({ ...prev, [category]: categoryData }));
    } catch (error) {
      console.error('Failed to load list of values for category:', category, error);
      setListOfValues([]);
      setLovData(prev => ({ ...prev, [category]: [] }));
    } finally {
      setLovLoading(false);
    }
  };

  const handleToggleEnabled = async (listOfValueId: number, enabled: boolean) => {
    try {
      await userSettingsService.toggleUserListOfValue(listOfValueId, enabled);
      
      // Update local state
      const updatedList = listOfValues.map(item => 
        item.listOfValueId === listOfValueId 
          ? { ...item, enabled } 
          : item
      );
      setListOfValues(updatedList);
      setLovData(prev => ({ ...prev, [selectedCategory]: updatedList }));
      
      setSnackbar({
        open: true,
        message: `List of value ${enabled ? 'enabled' : 'disabled'} successfully`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to toggle list of value:', error);
      setSnackbar({
        open: true,
        message: 'Failed to toggle list of value',
        severity: 'error'
      });
    }
  };

  return (
    <Box>
      <Card className={styles.listOfValuesCard}>
        <CardHeader
          title="Quản lý List of Values"
          subheader="Quản lý các danh sách giá trị cho content automation: industry, content type, language, tone, target audience, và AI provider."
          avatar={<ListIcon />}
        />
        <CardContent>
          <Grid container spacing={3} className={styles.gridContainer}>
            {/* Category Selection */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardHeader title="Categories" />
                <CardContent>
                  <List>
                    {PREDEFINED_CATEGORIES.map((category) => (
                      <ListItem
                        key={category.value}
                        button
                        selected={selectedCategory === category.value}
                        onClick={() => handleCategoryChange(category.value)}
                      >
                        <ListItemText
                          primary={category.label}
                          secondary={category.description}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Values Management */}
            <Grid item xs={12} md={8}>
              <Card variant="outlined">
                <CardHeader
                  title={PREDEFINED_CATEGORIES.find(c => c.value === selectedCategory)?.label || selectedCategory}
                  subheader="Toggle values to enable/disable them for your use"
                />
                <CardContent>
                  {lovLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : listOfValues.length > 0 ? (
                    <TableContainer className={styles.tableContainer}>
                      <Table size="small" className={styles.table}>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ width: 100, textAlign: 'center' }}>Enabled</TableCell>
                            <TableCell>Value</TableCell>
                            <TableCell>Label</TableCell>
                            <TableCell>Display Label</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Sort</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {listOfValues
                            .sort((a, b) => a.listOfValue.sortOrder - b.listOfValue.sortOrder)
                            .map((item) => (
                            <TableRow key={item.listOfValueId}>
                              <TableCell sx={{ textAlign: 'center' }}>
                                <Switch
                                  checked={item.enabled}
                                  onChange={(e) => handleToggleEnabled(item.listOfValueId, e.target.checked)}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{item.listOfValue.value}</TableCell>
                              <TableCell>{item.listOfValue.label}</TableCell>
                              <TableCell>{item.listOfValue.displayLabel}</TableCell>
                              <TableCell>{item.listOfValue.description}</TableCell>
                              <TableCell>{item.listOfValue.sortOrder}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Chưa có dữ liệu cho category này
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Liên hệ admin để thêm values cho category này
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ListOfValues;
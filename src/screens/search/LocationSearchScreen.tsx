/**
 * Location Search Screen - Step 1: Select location with autocomplete
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { api } from '../../api/client';
import Icon from '../../components/Icon';

// Popular locations in Bangladesh (fallback)
const POPULAR_LOCATIONS = [
  'Dhaka',
  'Gulshan, Dhaka',
  'Dhanmondi, Dhaka',
  'Banani, Dhaka',
  'Uttara, Dhaka',
  'Chittagong',
  'Cox\'s Bazar',
  'Sylhet',
  'Khulna',
  'Rajshahi',
];

interface LocationSuggestion {
  id: string;
  label: string;
  count?: number;
}

export default function LocationSearchScreen({ navigation }: any) {
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPopular, setShowPopular] = useState(true);

  // Load popular locations on mount
  useEffect(() => {
    loadLocations();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchText.trim() === '') {
      setShowPopular(true);
      loadLocations();
      return;
    }

    setShowPopular(false);
    const timeoutId = setTimeout(() => {
      loadLocations(searchText.trim());
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const loadLocations = async (searchTerm?: string) => {
    try {
      setLoading(true);
      console.log('📍 Loading locations, searchTerm:', searchTerm);
      
      const locations = await api.locations.search(searchTerm);
      
      console.log('📍 Location API Response:', JSON.stringify(locations, null, 2));
      console.log('📍 Response type:', typeof locations, 'Is array:', Array.isArray(locations));
      console.log('📍 Response length:', Array.isArray(locations) ? locations.length : 'N/A');
      
      if (locations && Array.isArray(locations) && locations.length > 0) {
        const formattedLocations = locations.map((loc: any, index: number) => {
          const locationObj = {
            id: loc.id || loc.label || loc._id || `loc-${index}-${Math.random()}`,
            label: loc.label || loc.id || loc._id || String(loc),
            count: loc.count || 0,
          };
          console.log(`📍 Location ${index}:`, locationObj);
          return locationObj;
        });
        console.log('✅ Formatted locations:', formattedLocations.length);
        setSuggestions(formattedLocations);
      } else {
        console.log('⚠️ No locations found in response');
        // Fallback to popular locations if no results
        if (!searchTerm) {
          console.log('📌 Using popular locations fallback');
          setSuggestions(POPULAR_LOCATIONS.map((loc, idx) => ({
            id: `popular-${idx}`,
            label: loc,
          })));
        } else {
          console.log('❌ No search results, showing empty');
          setSuggestions([]);
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to load locations:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      // Fallback to popular locations
      if (!searchTerm) {
        console.log('📌 Using popular locations fallback after error');
        setSuggestions(POPULAR_LOCATIONS.map((loc, idx) => ({
          id: `popular-${idx}`,
          label: loc,
        })));
      } else {
        setSuggestions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const handleSelectLocation = (location: string) => {
    // Navigate to date selection screen
    navigation.navigate('DateSelection', { location });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Where to?</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Icon name="location-outline" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search destinations"
            value={searchText}
            onChangeText={handleSearch}
            autoFocus
            placeholderTextColor={Colors.textTertiary}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Icon name="close-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>
          {searchText ? 'Search Results' : 'Popular Destinations'}
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.brand} />
            <Text style={styles.loadingText}>Searching locations...</Text>
          </View>
        ) : (
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.locationItem}
                onPress={() => handleSelectLocation(item.label)}
                activeOpacity={0.7}
              >
                <View style={styles.locationIcon}>
                  <Icon name="location-outline" size={20} color={Colors.brand} />
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationText}>{item.label}</Text>
                  {item.count !== undefined && (
                    <Text style={styles.locationCount}>{item.count} properties</Text>
                  )}
                </View>
                <Icon name="chevron-forward-outline" size={18} color={Colors.textTertiary} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No locations found</Text>
                <Text style={styles.emptySubtext}>
                  {searchText 
                    ? 'Try searching for a different location' 
                    : 'Popular destinations will appear here'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  backButton: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.gray100,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  title: { fontSize: 20, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, letterSpacing: -0.3 },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  searchInputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.gray50, borderRadius: 14,
    paddingHorizontal: 14, borderWidth: 1.5, borderColor: Colors.gray200,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: Colors.textPrimary, paddingVertical: 12 },
  content: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 12, fontWeight: Theme.fontWeight.semibold, color: Colors.textTertiary,
    marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  locationItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.gray100,
  },
  locationIcon: {
    width: 42, height: 42, borderRadius: 13, backgroundColor: '#FFF1F2',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  locationText: { flex: 1, fontSize: 15, fontWeight: Theme.fontWeight.medium, color: Colors.textPrimary },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 17, fontWeight: Theme.fontWeight.semibold, color: Colors.textSecondary, marginBottom: 4 },
  emptySubtext: { fontSize: 13, color: Colors.textTertiary },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  loadingText: { fontSize: 13, color: Colors.textSecondary, marginTop: 12 },
  locationInfo: { flex: 1 },
  locationCount: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
});


import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'requested' | 'in-progress' | 'completed';
  requestedAt: Date;
  estimatedTime: string;
  complexity: 'easy' | 'medium' | 'advanced';
}

interface FeatureContextType {
  featureRequests: FeatureRequest[];
  addFeatureRequest: (request: Omit<FeatureRequest, 'id' | 'requestedAt' | 'status'>) => void;
  updateFeatureRequest: (id: string, updates: Partial<FeatureRequest>) => void;
  deleteFeatureRequest: (id: string) => void;
  getRequestsByStatus: (status: FeatureRequest['status']) => FeatureRequest[];
  getRequestsByCategory: (category: string) => FeatureRequest[];
  isLoading: boolean;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export const useFeatures = () => {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeatures must be used within a FeatureProvider');
  }
  return context;
};

interface FeatureProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = '@feature_requests';

export const FeatureProvider: React.FC<FeatureProviderProps> = ({ children }) => {
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load feature requests from storage
  const loadFeatureRequests = async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const requestsWithDates = parsed.map((request: any) => ({
          ...request,
          requestedAt: new Date(request.requestedAt),
        }));
        setFeatureRequests(requestsWithDates);
        console.log('Loaded', requestsWithDates.length, 'feature requests');
      }
    } catch (error) {
      console.error('Error loading feature requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save feature requests to storage
  const saveFeatureRequests = async (requests: FeatureRequest[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
      console.log('Saved', requests.length, 'feature requests');
    } catch (error) {
      console.error('Error saving feature requests:', error);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadFeatureRequests();
  }, []);

  // Auto-save when requests change
  useEffect(() => {
    if (!isLoading && featureRequests.length >= 0) {
      saveFeatureRequests(featureRequests);
    }
  }, [featureRequests, isLoading]);

  const addFeatureRequest = (requestData: Omit<FeatureRequest, 'id' | 'requestedAt' | 'status'>) => {
    const newRequest: FeatureRequest = {
      ...requestData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      requestedAt: new Date(),
      status: 'requested',
    };
    
    setFeatureRequests(prev => [...prev, newRequest]);
    console.log('Added feature request:', newRequest.title);
  };

  const updateFeatureRequest = (id: string, updates: Partial<FeatureRequest>) => {
    setFeatureRequests(prev => 
      prev.map(request => 
        request.id === id ? { ...request, ...updates } : request
      )
    );
    console.log('Updated feature request:', id, updates);
  };

  const deleteFeatureRequest = (id: string) => {
    setFeatureRequests(prev => prev.filter(request => request.id !== id));
    console.log('Deleted feature request:', id);
  };

  const getRequestsByStatus = (status: FeatureRequest['status']) => {
    return featureRequests.filter(request => request.status === status);
  };

  const getRequestsByCategory = (category: string) => {
    return featureRequests.filter(request => request.category === category);
  };

  const value: FeatureContextType = {
    featureRequests,
    addFeatureRequest,
    updateFeatureRequest,
    deleteFeatureRequest,
    getRequestsByStatus,
    getRequestsByCategory,
    isLoading,
  };

  return (
    <FeatureContext.Provider value={value}>
      {children}
    </FeatureContext.Provider>
  );
};

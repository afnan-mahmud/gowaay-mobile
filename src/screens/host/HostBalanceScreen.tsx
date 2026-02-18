/**
 * Host Balance & Payouts Screen - View earnings and request withdrawals
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { api } from '../../api/client';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import Loading from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import { Toast } from '../../components/Toast';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { getErrorMessage } from '../../utils/errorMessages';

interface BalanceData {
  totalEarnings: number;
  availableBalance: number;
  pendingAmount: number;
  totalPayouts: number;
  monthlyEarnings?: number;
}

interface Transaction {
  _id: string;
  type: 'earning' | 'payout' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  date: string;
  description: string;
}

export default function HostBalanceScreen({ navigation }: any) {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bkash');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  
  // Bank-specific fields
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  useEffect(() => {
    loadBalanceData();
  }, []);

  const loadBalanceData = async () => {
    try {
      setError(null);
      const [balanceRes, transactionsRes] = await Promise.all([
        api.hosts.balance(),
        api.hosts.transactions(),
      ]);

      if (balanceRes.success && balanceRes.data) {
        setBalance(balanceRes.data as BalanceData);
      }

      // Ensure transactions is always an array
      if (transactionsRes.success && transactionsRes.data) {
        const transactionsData = transactionsRes.data;
        // Check if data is an array
        if (Array.isArray(transactionsData)) {
          setTransactions(transactionsData);
        } else if (transactionsData.transactions && Array.isArray(transactionsData.transactions)) {
          // If data is wrapped in an object with transactions property
          setTransactions(transactionsData.transactions);
        } else {
          // Default to empty array if format is unexpected
          console.warn('Unexpected transactions data format:', transactionsData);
          setTransactions([]);
        }
      } else {
        // If API call failed or no data, set empty array
        setTransactions([]);
      }
    } catch (err: any) {
      console.error('Failed to load balance data:', err);
      const msg = getErrorMessage(err);
      setError(msg);
      Toast.show({ type: 'error', title: 'Failed to Load Balance', message: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBalanceData();
  };

  const handleRequestPayout = () => {
    if (!balance || balance.availableBalance < 500) {
      Alert.alert('Error', 'Minimum payout amount is ৳500');
      return;
    }
    setShowPayoutModal(true);
  };

  const handleSubmitPayout = async () => {
    const amount = parseFloat(payoutAmount);

    if (!payoutAmount || isNaN(amount) || amount < 500) {
      Alert.alert('Error', 'Please enter a valid payout amount (minimum ৳500)');
      return;
    }

    if (amount > (balance?.availableBalance || 0)) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    // Validation for different payment methods
    if (payoutMethod === 'bank') {
      if (!bankName.trim()) {
        Alert.alert('Error', 'Please enter bank name');
        return;
      }
      if (!branchName.trim()) {
        Alert.alert('Error', 'Please enter branch name');
        return;
      }
      if (!accountHolderName.trim()) {
        Alert.alert('Error', 'Please enter account holder name');
        return;
      }
      if (!accountNumber.trim()) {
        Alert.alert('Error', 'Please enter account number');
        return;
      }
    } else {
      // For bkash and nagad
      if (!payoutDetails.trim()) {
        Alert.alert('Error', 'Please enter your account details');
        return;
      }
    }

    setSubmitting(true);
    try {
      // Format data according to backend schema
      let payoutData: any = {
        amountTk: amount,
        method: {
          type: payoutMethod, // 'bkash', 'nagad', or 'bank'
          subtype: 'personal',
        }
      };

      // Add method-specific fields
      if (payoutMethod === 'bank') {
        payoutData.method.accountNo = accountNumber.trim();
        payoutData.method.bankFields = {
          bankName: bankName.trim(),
          branchName: branchName.trim(),
          accountHolderName: accountHolderName.trim(),
        };
      } else {
        // For bkash and nagad
        payoutData.method.accountNo = payoutDetails.trim();
      }

      console.log('Submitting payout request:', payoutData);

      const response = await api.hosts.requestPayout(payoutData);

      if (response.success) {
        Alert.alert('Success', 'Payout request submitted successfully');
        setShowPayoutModal(false);
        // Reset all fields
        setPayoutAmount('');
        setPayoutDetails('');
        setBankName('');
        setBranchName('');
        setAccountHolderName('');
        setAccountNumber('');
        loadBalanceData();
      } else {
        Alert.alert('Error', (response as any).message || 'Failed to request payout');
      }
    } catch (error: any) {
      console.error('Payout request error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to request payout';
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getTransactionIconName = (type: string): string => {
    switch (type) {
      case 'earning':
        return 'cash-outline';
      case 'payout':
        return 'arrow-up-circle-outline';
      case 'refund':
        return 'return-down-back-outline';
      default:
        return 'wallet-outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'failed':
        return Colors.error;
      default:
        return Colors.gray500;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return <Loading message="Loading balance..." />;
  }

  if (error && !balance) {
    return <ErrorState title="Failed to Load Balance" message={error} onRetry={loadBalanceData} />;
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {/* Balance Overview */}
        <Card style={styles.balanceCard}>
          <Text style={styles.balanceTitle}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            ৳{balance?.availableBalance?.toLocaleString() || 0}
          </Text>
          <Button
            title="Request Payout"
            onPress={handleRequestPayout}
            style={styles.payoutButton}
            textStyle={styles.payoutButtonText}
            disabled={!balance || balance.availableBalance < 500}
          />
          <Text style={styles.balanceNote}>Minimum payout: ৳500</Text>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Icon name="cash-outline" size={28} color={Colors.brand} style={styles.statIcon} />
            <Text style={styles.statValue}>
              ৳{balance?.totalEarnings?.toLocaleString() || 0}
            </Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </Card>

          <Card style={styles.statCard}>
            <Icon name="time-outline" size={28} color={Colors.warning} style={styles.statIcon} />
            <Text style={[styles.statValue, { color: Colors.warning }]}>
              ৳{balance?.pendingAmount?.toLocaleString() || 0}
            </Text>
            <Text style={styles.statLabel}>Pending Payout</Text>
          </Card>

          <Card style={styles.statCard}>
            <Icon name="checkmark-circle" size={28} color={Colors.success} style={styles.statIcon} />
            <Text style={[styles.statValue, { color: Colors.success }]}>
              ৳{balance?.totalPayouts?.toLocaleString() || 0}
            </Text>
            <Text style={styles.statLabel}>Withdrawn</Text>
          </Card>
        </View>

        {/* Transaction History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction History</Text>

          {!transactions || transactions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Icon name="bar-chart-outline" size={48} color={Colors.gray400} />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </Card>
          ) : (
            transactions.map((transaction) => (
              <Card key={transaction._id} style={styles.transactionCard}>
                <View style={styles.transactionContent}>
                  <View style={styles.transactionLeft}>
                    <Icon
                      name={getTransactionIconName(transaction.type)}
                      size={24}
                      color={Colors.brand}
                      style={styles.transactionIcon}
                    />
                    <View>
                      <Text style={styles.transactionTitle}>
                        {transaction.description}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formatDate(transaction.date)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text
                      style={[
                        styles.transactionAmount,
                        transaction.type === 'payout' && { color: Colors.error },
                      ]}
                    >
                      {transaction.type === 'payout' ? '-' : '+'}৳
                      {transaction.amount.toLocaleString()}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(transaction.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>{transaction.status}</Text>
                    </View>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Payout Info */}
        <Card style={styles.infoCard}>
          <Icon name="information-circle-outline" size={32} color={Colors.info} style={styles.infoIcon} />
          <Text style={styles.infoTitle}>Payout Information</Text>
          <Text style={styles.infoText}>
            • Minimum payout amount: ৳500{'\n'}
            • Processing time: 3-5 business days{'\n'}
            • Payment methods: bKash, Nagad, Bank Transfer{'\n'}
            • Service fee: 1% + ৳10{'\n'}
            • Contact support for any issues
          </Text>
        </Card>
      </View>

      {/* Payout Request Modal */}
      <Modal
        visible={showPayoutModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPayoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Payout</Text>
              <TouchableOpacity onPress={() => setShowPayoutModal(false)}>
                <Icon name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label="Amount (৳)"
                placeholder={`Max: ${balance?.availableBalance || 0}`}
                value={payoutAmount}
                onChangeText={setPayoutAmount}
                keyboardType="decimal-pad"
              />

              <View style={styles.methodSelector}>
                <Text style={styles.methodLabel}>Payment Method</Text>
                <View style={styles.methodOptions}>
                  {['bkash', 'nagad', 'bank'].map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.methodOption,
                        payoutMethod === method && styles.methodOptionActive,
                      ]}
                      onPress={() => setPayoutMethod(method)}
                    >
                      <Text
                        style={[
                          styles.methodOptionText,
                          payoutMethod === method && styles.methodOptionTextActive,
                        ]}
                      >
                        {method.charAt(0).toUpperCase() + method.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Bank-specific fields */}
              {payoutMethod === 'bank' ? (
                <>
                  <Input
                    label="Bank Name"
                    placeholder="Enter bank name"
                    value={bankName}
                    onChangeText={setBankName}
                  />
                  <Input
                    label="Branch Name"
                    placeholder="Enter branch name"
                    value={branchName}
                    onChangeText={setBranchName}
                  />
                  <Input
                    label="Account Holder Name"
                    placeholder="Enter account holder name"
                    value={accountHolderName}
                    onChangeText={setAccountHolderName}
                  />
                  <Input
                    label="Account Number"
                    placeholder="Enter account number"
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    keyboardType="numeric"
                  />
                </>
              ) : (
                <Input
                  label="Account Details"
                  placeholder="Mobile number"
                  value={payoutDetails}
                  onChangeText={setPayoutDetails}
                  keyboardType="phone-pad"
                />
              )}

              <Button
                title="Submit Request"
                onPress={handleSubmitPayout}
                loading={submitting}
                style={styles.submitButton}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F8',
  },
  content: {
    padding: 14,
  },
  balanceCard: {
    alignItems: 'center',
    padding: 16,
    marginBottom: Theme.spacing.md,
    backgroundColor: Colors.brand,
    borderRadius: 17,
  },
  balanceTitle: {
    fontSize: 13,
    color: Colors.white,
    marginBottom: Theme.spacing.sm,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.white,
    marginBottom: Theme.spacing.lg,
    letterSpacing: -0.2,
  },
  payoutButton: {
    backgroundColor: Colors.white,
    marginBottom: Theme.spacing.sm,
  },
  payoutButtonText: {
    color: Colors.brand,
  },
  balanceNote: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.gray100,
    ...Theme.shadows.sm,
  },
  statIcon: {
    marginBottom: Theme.spacing.xs,
  },
  statValue: {
    fontSize: 16,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.brand,
    marginBottom: Theme.spacing.xs,
    letterSpacing: -0.2,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textTertiary,
    marginBottom: Theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  transactionCard: {
    marginBottom: Theme.spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.gray100,
    padding: 14,
    ...Theme.shadows.sm,
  },
  transactionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    marginRight: Theme.spacing.md,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.success,
    marginBottom: Theme.spacing.xs,
    letterSpacing: -0.2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: Theme.fontWeight.medium,
    textTransform: 'capitalize',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.gray100,
    ...Theme.shadows.sm,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Theme.spacing.sm,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  infoCard: {
    backgroundColor: Colors.white,
    marginBottom: Theme.spacing.xl,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.gray100,
    padding: 14,
    ...Theme.shadows.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  infoIcon: {
    marginBottom: Theme.spacing.sm,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.sm,
    letterSpacing: -0.2,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  modalClose: {
    color: Colors.textSecondary,
  },
  methodSelector: {
    marginBottom: Theme.spacing.md,
  },
  methodLabel: {
    fontSize: 12,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.textTertiary,
    marginBottom: Theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  methodOptions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  methodOption: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: Theme.spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.gray100,
    alignItems: 'center',
  },
  methodOptionActive: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  methodOptionText: {
    fontSize: 13,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.textPrimary,
  },
  methodOptionTextActive: {
    color: Colors.white,
  },
  submitButton: {
    marginTop: Theme.spacing.md,
  },
});

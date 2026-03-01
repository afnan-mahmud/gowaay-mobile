/**
 * Host Balance & Payouts Screen — Glassmorphism redesign
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
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { api } from '../../api/client';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Icon from '../../components/Icon';
import Loading from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import { Toast } from '../../components/Toast';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';
import { getErrorMessage } from '../../utils/errorMessages';

const { width: SW } = Dimensions.get('window');
const STATUS_H = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;
const GLASS_LIGHT  = 'rgba(255,255,255,0.14)';
const GLASS_BORDER = 'rgba(255,255,255,0.28)';

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
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  useEffect(() => { loadBalanceData(); }, []);

  const loadBalanceData = async () => {
    try {
      setError(null);
      const [balanceRes, transactionsRes] = await Promise.all([api.hosts.balance(), api.hosts.transactions()]);
      if (balanceRes.success && balanceRes.data) setBalance(balanceRes.data as BalanceData);
      if (transactionsRes.success && transactionsRes.data) {
        const d = transactionsRes.data;
        if (Array.isArray(d)) setTransactions(d);
        else if ((d as any).transactions && Array.isArray((d as any).transactions)) setTransactions((d as any).transactions);
        else setTransactions([]);
      } else setTransactions([]);
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setError(msg);
      Toast.show({ type: 'error', title: 'Failed to Load Balance', message: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadBalanceData(); };

  const handleRequestPayout = () => {
    if (!balance || balance.availableBalance < 500) { Alert.alert('Error', 'Minimum payout amount is ৳500'); return; }
    setShowPayoutModal(true);
  };

  const handleSubmitPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (!payoutAmount || isNaN(amount) || amount < 500) { Alert.alert('Error', 'Please enter a valid payout amount (minimum ৳500)'); return; }
    if (amount > (balance?.availableBalance || 0)) { Alert.alert('Error', 'Insufficient balance'); return; }
    if (payoutMethod === 'bank') {
      if (!bankName.trim()) { Alert.alert('Error', 'Please enter bank name'); return; }
      if (!branchName.trim()) { Alert.alert('Error', 'Please enter branch name'); return; }
      if (!accountHolderName.trim()) { Alert.alert('Error', 'Please enter account holder name'); return; }
      if (!accountNumber.trim()) { Alert.alert('Error', 'Please enter account number'); return; }
    } else {
      if (!payoutDetails.trim()) { Alert.alert('Error', 'Please enter your account details'); return; }
    }

    setSubmitting(true);
    try {
      let payoutData: any = { amountTk: amount, method: { type: payoutMethod, subtype: 'personal' } };
      if (payoutMethod === 'bank') {
        payoutData.method.accountNo = accountNumber.trim();
        payoutData.method.bankFields = { bankName: bankName.trim(), branchName: branchName.trim(), accountHolderName: accountHolderName.trim() };
      } else {
        payoutData.method.accountNo = payoutDetails.trim();
      }
      const response = await api.hosts.requestPayout(payoutData);
      if (response.success) {
        Alert.alert('Success', 'Payout request submitted successfully');
        setShowPayoutModal(false);
        setPayoutAmount(''); setPayoutDetails(''); setBankName(''); setBranchName(''); setAccountHolderName(''); setAccountNumber('');
        loadBalanceData();
      } else {
        Alert.alert('Error', (response as any).message || 'Failed to request payout');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to request payout');
    } finally {
      setSubmitting(false);
    }
  };

  const getTransactionIconName = (type: string): string => {
    switch (type) {
      case 'earning': return 'cash-outline';
      case 'payout':  return 'arrow-up-circle-outline';
      case 'refund':  return 'return-down-back-outline';
      default:        return 'wallet-outline';
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': return { color: Colors.success, bg: Colors.success + '18' };
      case 'pending':   return { color: Colors.warning, bg: Colors.warning + '18' };
      case 'failed':    return { color: Colors.error,   bg: Colors.error   + '18' };
      default:          return { color: Colors.gray500, bg: Colors.gray100 };
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  if (loading) return <Loading message="Loading balance..." />;
  if (error && !balance) return <ErrorState title="Failed to Load Balance" message={error} onRetry={loadBalanceData} />;

  const statsItems = [
    { icon: 'cash-outline', value: `৳${balance?.totalEarnings?.toLocaleString() || 0}`, label: 'Total Earned', color: Colors.brand },
    { icon: 'time-outline', value: `৳${balance?.pendingAmount?.toLocaleString() || 0}`, label: 'Pending', color: Colors.warning },
    { icon: 'checkmark-circle', value: `৳${balance?.totalPayouts?.toLocaleString() || 0}`, label: 'Withdrawn', color: Colors.success },
  ];

  return (
    <>
      <ScrollView style={S.root} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />}>

        {/* ── Hero balance card ── */}
        <View style={S.heroWrapper}>
          <View style={S.heroBg} />
          <View style={S.heroCircle1} />
          <View style={S.heroCircle2} />
          <View style={S.heroContent}>
            <Text style={S.heroEyebrow}>Available Balance</Text>
            <Text style={S.heroAmount}>৳{balance?.availableBalance?.toLocaleString() || 0}</Text>
            <Text style={S.heroNote}>Minimum payout: ৳500</Text>
            <TouchableOpacity
              style={[S.payoutBtn, (!balance || balance.availableBalance < 500) && S.payoutBtnDisabled]}
              onPress={handleRequestPayout}
              disabled={!balance || balance.availableBalance < 500}
              activeOpacity={0.85}
            >
              <Icon name="arrow-up-circle-outline" size={18} color={Colors.brand} />
              <Text style={S.payoutBtnText}>Request Payout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={S.body}>
          {/* ── Stats ── */}
          <View style={S.statsRow}>
            {statsItems.map((s, i) => (
              <View key={i} style={S.statCard}>
                <View style={[S.statIconWrap, { backgroundColor: s.color + '15' }]}>
                  <Icon name={s.icon} size={20} color={s.color} />
                </View>
                <Text style={[S.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={S.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* ── Transactions ── */}
          <View style={S.section}>
            <Text style={S.sectionTitle}>Transaction History</Text>

            {transactions.length === 0 ? (
              <View style={S.emptyCard}>
                <View style={S.emptyIconWrap}><Icon name="bar-chart-outline" size={28} color={Colors.gray400} /></View>
                <Text style={S.emptyText}>No transactions yet</Text>
              </View>
            ) : (
              transactions.map(tx => {
                const sc = getStatusConfig(tx.status);
                return (
                  <View key={tx._id} style={S.txCard}>
                    <View style={[S.txIconWrap, { backgroundColor: (tx.type === 'payout' ? Colors.error : Colors.success) + '15' }]}>
                      <Icon name={getTransactionIconName(tx.type)} size={20} color={tx.type === 'payout' ? Colors.error : Colors.success} />
                    </View>
                    <View style={S.txMiddle}>
                      <Text style={S.txTitle}>{tx.description}</Text>
                      <Text style={S.txDate}>{formatDate(tx.date)}</Text>
                    </View>
                    <View style={S.txRight}>
                      <Text style={[S.txAmount, tx.type === 'payout' && { color: Colors.error }]}>
                        {tx.type === 'payout' ? '-' : '+'}৳{tx.amount.toLocaleString()}
                      </Text>
                      <View style={[S.txBadge, { backgroundColor: sc.bg }]}>
                        <Text style={[S.txBadgeText, { color: sc.color }]}>{tx.status}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* ── Info ── */}
          <View style={S.infoCard}>
            <View style={S.infoHeader}>
              <View style={S.infoIconWrap}><Icon name="information-circle-outline" size={20} color={Colors.info} /></View>
              <Text style={S.infoTitle}>Payout Information</Text>
            </View>
            <Text style={S.infoText}>
              • Minimum payout amount: ৳500{'\n'}
              • Processing time: 3-5 business days{'\n'}
              • Payment methods: bKash, Nagad, Bank Transfer{'\n'}
              • Service fee: 1% + ৳10{'\n'}
              • Contact support for any issues
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Payout Modal ── */}
      <Modal visible={showPayoutModal} animationType="slide" transparent onRequestClose={() => setShowPayoutModal(false)}>
        <View style={S.modalOverlay}>
          <View style={S.modalSheet}>
            <View style={S.modalHandle} />
            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>Request Payout</Text>
              <TouchableOpacity style={S.modalClose} onPress={() => setShowPayoutModal(false)}>
                <Icon name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Input label="Amount (৳)" placeholder={`Max: ৳${balance?.availableBalance || 0}`} value={payoutAmount} onChangeText={setPayoutAmount} keyboardType="decimal-pad" />
              <View style={S.methodSection}>
                <Text style={S.methodLabel}>Payment Method</Text>
                <View style={S.methodRow}>
                  {['bkash', 'nagad', 'bank'].map(method => (
                    <TouchableOpacity key={method} style={[S.methodBtn, payoutMethod === method && S.methodBtnActive]} onPress={() => setPayoutMethod(method)}>
                      <Text style={[S.methodBtnText, payoutMethod === method && S.methodBtnTextActive]}>
                        {method.charAt(0).toUpperCase() + method.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {payoutMethod === 'bank' ? (
                <>
                  <Input label="Bank Name" placeholder="Enter bank name" value={bankName} onChangeText={setBankName} />
                  <Input label="Branch Name" placeholder="Enter branch name" value={branchName} onChangeText={setBranchName} />
                  <Input label="Account Holder Name" placeholder="Enter account holder name" value={accountHolderName} onChangeText={setAccountHolderName} />
                  <Input label="Account Number" placeholder="Enter account number" value={accountNumber} onChangeText={setAccountNumber} keyboardType="numeric" />
                </>
              ) : (
                <Input label="Account Details" placeholder="Mobile number" value={payoutDetails} onChangeText={setPayoutDetails} keyboardType="phone-pad" />
              )}
              <Button title="Submit Request" onPress={handleSubmitPayout} loading={submitting} style={S.submitBtn} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F4F8' },

  // Hero
  heroWrapper: { overflow: 'visible', paddingBottom: 0 },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.brand, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 },
  heroCircle1: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -50 },
  heroCircle2: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(0,0,0,0.08)', bottom: 0, left: -30 },
  heroContent: { paddingTop: STATUS_H + 20, paddingHorizontal: 24, paddingBottom: 32, alignItems: 'center' },
  heroEyebrow: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  heroAmount: { fontSize: 52, fontWeight: Theme.fontWeight.bold, color: Colors.white, letterSpacing: -1, marginBottom: 6 },
  heroNote: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 20 },
  payoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.white, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 20 },
  payoutBtnDisabled: { opacity: 0.5 },
  payoutBtnText: { fontSize: 15, fontWeight: Theme.fontWeight.bold, color: Colors.brand },

  body: { padding: 16, paddingTop: 20 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 20, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.gray100, ...Theme.shadows.sm },
  statIconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 14, fontWeight: Theme.fontWeight.bold, letterSpacing: -0.3, marginBottom: 2, textAlign: 'center' },
  statLabel: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },

  // Section
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, letterSpacing: -0.3, marginBottom: 14 },

  // Transaction
  emptyCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: Colors.gray100 },
  emptyIconWrap: { width: 56, height: 56, borderRadius: 18, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
  txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 18, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.gray100, ...Theme.shadows.sm },
  txIconWrap: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txMiddle: { flex: 1 },
  txTitle: { fontSize: 14, fontWeight: Theme.fontWeight.medium, color: Colors.textPrimary, marginBottom: 2 },
  txDate: { fontSize: 12, color: Colors.textSecondary },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 15, fontWeight: Theme.fontWeight.bold, color: Colors.success, letterSpacing: -0.2, marginBottom: 4 },
  txBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 20 },
  txBadgeText: { fontSize: 11, fontWeight: Theme.fontWeight.medium, textTransform: 'capitalize' },

  // Info
  infoCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: Colors.gray100, borderLeftWidth: 4, borderLeftColor: Colors.info, marginBottom: 30, ...Theme.shadows.sm },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  infoIconWrap: { width: 34, height: 34, borderRadius: 12, backgroundColor: Colors.info + '15', alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontSize: 16, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary },
  infoText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 22 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.gray200, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: Theme.fontWeight.bold, color: Colors.textPrimary, letterSpacing: -0.3 },
  modalClose: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center' },
  methodSection: { marginBottom: 16 },
  methodLabel: { fontSize: 12, fontWeight: Theme.fontWeight.semibold, color: Colors.textTertiary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  methodRow: { flexDirection: 'row', gap: 10 },
  methodBtn: { flex: 1, paddingVertical: 13, borderRadius: 16, borderWidth: 1, borderColor: Colors.gray200, alignItems: 'center', backgroundColor: Colors.gray50 },
  methodBtnActive: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  methodBtnText: { fontSize: 13, fontWeight: Theme.fontWeight.medium, color: Colors.textPrimary },
  methodBtnTextActive: { color: Colors.white },
  submitBtn: { marginTop: 16, marginBottom: 8 },
});

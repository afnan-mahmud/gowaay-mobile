/**
 * Terms of Service Screen
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Card from '../../components/Card';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';

export default function TermsOfServiceScreen({ navigation }: any) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.title}>Terms & Conditions</Text>
          <Text style={styles.subtitle}>Please read these terms carefully before using our service.</Text>
          
          <Text style={styles.effectiveDate}>
            <Text style={styles.bold}>Last Updated:</Text> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>

          <View style={styles.highlightBox}>
            <Text style={styles.highlightTitle}>Thank you for choosing GoWaay!</Text>
            <Text style={styles.highlightText}>
              GoWaay is a government-licensed proprietorship company operating under the business name "GoWaay," 
              duly registered and licensed under the laws of Bangladesh. These Terms & Conditions ("Terms") constitute 
              a legally binding agreement between you and GoWaay governing your use of our website, mobile applications, 
              and all related services (collectively referred to as the "GoWaay Platform").
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Definitions and Key Terms</Text>

          <Text style={styles.subsectionTitle}>Platform</Text>
          <Text style={styles.paragraph}>
            GoWaay operates as an online marketplace connecting registered users ("Members" and "Property Owners") 
            to facilitate transactions for accommodation services throughout Bangladesh.
          </Text>

          <Text style={styles.subsectionTitle}>Member/Guest/User</Text>
          <Text style={styles.paragraph}>
            Any individual who reserves accommodation services provided by Property Owners through the GoWaay Platform 
            using a registered account. This includes any accompanying individuals such as family members, friends, 
            colleagues, or other guests.
          </Text>

          <Text style={styles.subsectionTitle}>Property Owner/Host</Text>
          <Text style={styles.paragraph}>
            An individual or entity offering accommodation services via the GoWaay Platform through their verified account. 
            This encompasses anyone providing lodging or related services to Members.
          </Text>

          <Text style={styles.subsectionTitle}>Booking</Text>
          <Text style={styles.paragraph}>
            When a Guest reserves Property Services listed by a Property Owner on the platform, it creates a binding 
            contractual agreement between the Guest and the Property Owner upon confirmation.
          </Text>

          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing or using the GoWaay Platform, you agree to be bound by these Terms. If you do not agree 
            to these Terms, you may not use our Platform or Services.
          </Text>

          <Text style={styles.sectionTitle}>2. Account Registration</Text>
          <Text style={styles.paragraph}>
            To use certain features of our Platform, you must register for an account. You agree to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Provide accurate, current, and complete information</Text>
            <Text style={styles.bullet}>• Maintain and update your information as necessary</Text>
            <Text style={styles.bullet}>• Maintain the security of your account credentials</Text>
            <Text style={styles.bullet}>• Accept responsibility for all activities under your account</Text>
          </View>

          <Text style={styles.sectionTitle}>3. User Responsibilities</Text>
          <Text style={styles.paragraph}>
            As a user of the Platform, you agree to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Use the Platform only for lawful purposes</Text>
            <Text style={styles.bullet}>• Respect other users' rights and property</Text>
            <Text style={styles.bullet}>• Provide accurate information in listings and bookings</Text>
            <Text style={styles.bullet}>• Comply with all applicable laws and regulations</Text>
            <Text style={styles.bullet}>• Not engage in fraudulent, abusive, or harmful activities</Text>
          </View>

          <Text style={styles.sectionTitle}>4. Property Listings</Text>
          <Text style={styles.paragraph}>
            Hosts are responsible for:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Providing accurate and complete property descriptions</Text>
            <Text style={styles.bullet}>• Maintaining properties in good condition</Text>
            <Text style={styles.bullet}>• Honoring confirmed bookings</Text>
            <Text style={styles.bullet}>• Complying with all local laws and regulations</Text>
          </View>

          <Text style={styles.sectionTitle}>5. Bookings and Payments</Text>
          <Text style={styles.paragraph}>
            When you make a booking:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• You enter into a contract directly with the Host</Text>
            <Text style={styles.bullet}>• Payment is processed through our secure payment system</Text>
            <Text style={styles.bullet}>• Cancellation policies apply as specified in the listing</Text>
            <Text style={styles.bullet}>• Refunds are subject to our Refund Policy</Text>
          </View>

          <Text style={styles.sectionTitle}>6. Fees and Charges</Text>
          <Text style={styles.paragraph}>
            GoWaay charges service fees for transactions conducted through the Platform. These fees are clearly 
            displayed before you confirm a booking. Hosts may also be subject to additional fees for listing services.
          </Text>

          <Text style={styles.sectionTitle}>7. Cancellation and Refunds</Text>
          <Text style={styles.paragraph}>
            Cancellation policies vary by property and are displayed in each listing. Refunds are processed according 
            to our Refund Policy, which is incorporated into these Terms by reference.
          </Text>

          <Text style={styles.sectionTitle}>8. Dispute Resolution</Text>
          <Text style={styles.paragraph}>
            In case of disputes between Guests and Hosts, GoWaay may assist in resolution but is not a party to 
            the contract between Guests and Hosts. We encourage users to resolve disputes amicably.
          </Text>

          <Text style={styles.sectionTitle}>9. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            All content on the Platform, including text, graphics, logos, and software, is the property of GoWaay 
            or its licensors and is protected by copyright and other intellectual property laws.
          </Text>

          <Text style={styles.sectionTitle}>10. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            GoWaay acts as an intermediary platform and is not responsible for the actions, omissions, or conduct 
            of users. We do not guarantee the accuracy of listings or the quality of accommodations.
          </Text>

          <Text style={styles.sectionTitle}>11. Modifications to Terms</Text>
          <Text style={styles.paragraph}>
            GoWaay reserves the right to modify these Terms at any time. Changes will be effective upon posting on 
            the Platform. Your continued use of the Platform constitutes acceptance of modified Terms.
          </Text>

          <Text style={styles.sectionTitle}>12. Contact Information</Text>
          <Text style={styles.paragraph}>
            For questions about these Terms, please contact us:
          </Text>
          <Text style={styles.contactInfo}>
            Email: support@gowaay.com{'\n'}
            Phone: 01611-553628
          </Text>

          <Text style={styles.paragraph}>
            These Terms are governed by the laws of Bangladesh. Any disputes shall be subject to the exclusive 
            jurisdiction of the courts of Bangladesh.
          </Text>
        </Card>
      </View>
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
  card: {
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.gray100,
    ...Theme.shadows.sm,
  },
  title: {
    fontSize: 17,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.sm,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  highlightBox: {
    backgroundColor: Colors.infoLight,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
    padding: 14,
    borderRadius: Theme.borderRadius.md,
    marginBottom: 16,
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.sm,
    letterSpacing: -0.2,
  },
  highlightText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  effectiveDate: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: 14,
  },
  paragraph: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    color: Colors.textTertiary,
    marginTop: 16,
    marginBottom: 14,
  },
  subsectionTitle: {
    fontSize: 15,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textPrimary,
    marginTop: 14,
    marginBottom: Theme.spacing.sm,
    letterSpacing: -0.2,
  },
  bulletList: {
    marginLeft: 14,
    marginBottom: 14,
  },
  bullet: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Theme.spacing.xs,
  },
  bold: {
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
  },
  contactInfo: {
    fontSize: 13,
    color: Colors.brand,
    fontWeight: Theme.fontWeight.medium,
    marginBottom: 14,
    lineHeight: 24,
  },
});

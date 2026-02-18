/**
 * Refund Policy Screen
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

export default function RefundPolicyScreen({ navigation }: any) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.title}>Refund Policy</Text>
          <Text style={styles.subtitle}>Our refund terms and how refunds are processed</Text>
          
          <View style={styles.highlightBox}>
            <Text style={styles.highlightTitle}>Guest Refund & Cancellation Policy</Text>
            <Text style={styles.highlightText}>
              These terms and conditions outline GoWaay's policy for Guest refunds and the responsibilities of 
              Hosts in connection with the Guest Refund Policy. This Guest Refund Policy is applicable in addition 
              to GoWaay's Terms & Conditions. The Guest Refund Policy is available to Guests who book and pay 
              for an Accommodation through the GoWaay Platform and experience a Booking Issue (as defined below). 
              The Guest's rights under this Guest Refund Policy take precedence over the Host's cancellation policy.
            </Text>
          </View>

          <Text style={styles.effectiveDate}>
            <Text style={styles.bold}>Effective Date:</Text> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>

          <Text style={styles.paragraph}>
            All capitalized terms shall have the meaning set forth in the GoWaay Terms & Conditions unless 
            otherwise defined in this Guest Refund Policy.
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Agreement to Policy</Text>
            <Text style={styles.infoText}>
              By using the GoWaay Platform as a Host or Guest, you confirm that you have read, understood, 
              and agree to be bound by this Guest Refund Policy.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>1. BOOKING ISSUE</Text>
          <Text style={styles.paragraph}>
            A <Text style={styles.bold}>"Booking Issue"</Text> refers to any one of the following circumstances:
          </Text>

          <Text style={styles.subsectionTitle}>(a) Host Non-Performance</Text>
          <Text style={styles.paragraph}>
            A Booking Issue exists when the Host of the Accommodation:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>(i) Cancels a booking shortly before the scheduled check-in time, or</Text>
            <Text style={styles.bullet}>(ii) Fails to provide the Guest with reasonable access to the Accommodation 
            (e.g., does not provide keys, security codes, gate access, or entry instructions).</Text>
          </View>

          <Text style={styles.subsectionTitle}>(b) Inaccurate Listing Description</Text>
          <Text style={styles.paragraph}>
            A Booking Issue exists when the Listing's description or representation of the Accommodation is 
            materially inaccurate with respect to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• The size and configuration of the Accommodation</Text>
            <Text style={styles.bullet}>• Whether the booking is for an entire home, private room, or shared room</Text>
            <Text style={styles.bullet}>• Special amenities or features advertised in the Listing are unavailable or non-functional</Text>
          </View>

          <Text style={styles.subsectionTitle}>(c) Cleanliness and Safety Issues</Text>
          <Text style={styles.paragraph}>
            A Booking Issue exists when, at the start of the Guest's booking, the Accommodation:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>(i) Is not generally clean and sanitary</Text>
            <Text style={styles.bullet}>(ii) Contains safety or health hazards that would reasonably be expected to 
            adversely affect the Guest's stay</Text>
          </View>

          <Text style={styles.sectionTitle}>2. REFUND PROCESS</Text>
          <Text style={styles.paragraph}>
            If you experience a Booking Issue, you must:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Report the issue to GoWaay within 24 hours of check-in</Text>
            <Text style={styles.bullet}>• Provide evidence of the Booking Issue (photos, videos, etc.)</Text>
            <Text style={styles.bullet}>• Cooperate with GoWaay's investigation</Text>
          </View>

          <Text style={styles.paragraph}>
            Upon verification of a valid Booking Issue, GoWaay will process a refund according to the severity 
            and nature of the issue.
          </Text>

          <Text style={styles.sectionTitle}>3. REFUND AMOUNTS</Text>
          <Text style={styles.paragraph}>
            Refund amounts depend on the type and severity of the Booking Issue:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• <Text style={styles.bold}>Full Refund:</Text> For major issues that make the accommodation unusable</Text>
            <Text style={styles.bullet}>• <Text style={styles.bold}>Partial Refund:</Text> For issues that affect the stay but don't make it unusable</Text>
            <Text style={styles.bullet}>• <Text style={styles.bold}>No Refund:</Text> For issues reported after the stay or not verified</Text>
          </View>

          <Text style={styles.sectionTitle}>4. CANCELLATION POLICY</Text>
          <Text style={styles.paragraph}>
            Standard cancellation policies apply unless a Booking Issue is verified:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• <Text style={styles.bold}>Free Cancellation:</Text> Up to 48 hours before check-in</Text>
            <Text style={styles.bullet}>• <Text style={styles.bold}>Partial Refund:</Text> 24-48 hours before check-in (50% refund)</Text>
            <Text style={styles.bullet}>• <Text style={styles.bold}>No Refund:</Text> Less than 24 hours before check-in</Text>
          </View>
          <Text style={styles.paragraph}>
            Note: Cancellation policies may vary by property and are displayed in each listing.
          </Text>

          <Text style={styles.sectionTitle}>5. PROCESSING TIME</Text>
          <Text style={styles.paragraph}>
            Refunds are typically processed within 5-10 business days after approval. The refund will be credited to 
            the original payment method used for the booking.
          </Text>

          <Text style={styles.sectionTitle}>6. HOST RESPONSIBILITIES</Text>
          <Text style={styles.paragraph}>
            Hosts are responsible for:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Providing accurate property descriptions</Text>
            <Text style={styles.bullet}>• Maintaining properties in advertised condition</Text>
            <Text style={styles.bullet}>• Honoring confirmed bookings</Text>
            <Text style={styles.bullet}>• Addressing Guest concerns promptly</Text>
          </View>

          <Text style={styles.sectionTitle}>7. DISPUTE RESOLUTION</Text>
          <Text style={styles.paragraph}>
            If you disagree with a refund decision, you may:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Request a review by providing additional evidence</Text>
            <Text style={styles.bullet}>• Contact our customer support team</Text>
            <Text style={styles.bullet}>• Escalate the matter through our dispute resolution process</Text>
          </View>

          <Text style={styles.sectionTitle}>8. CONTACT US</Text>
          <Text style={styles.paragraph}>
            For questions about refunds or to report a Booking Issue, please contact us:
          </Text>
          <Text style={styles.contactInfo}>
            Email: support@gowaay.com{'\n'}
            Phone: 01611-553628{'\n'}
            WhatsApp: 01611-553628
          </Text>

          <Text style={styles.paragraph}>
            GoWaay reserves the right to modify this Refund Policy at any time. Changes will be effective upon 
            posting on the Platform.
          </Text>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
  },
  content: {
    padding: Theme.spacing.md,
  },
  card: {
    padding: Theme.spacing.lg,
  },
  title: {
    fontSize: Theme.fontSize.xxxl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.sm,
  },
  subtitle: {
    fontSize: Theme.fontSize.lg,
    color: Colors.textSecondary,
    marginBottom: Theme.spacing.lg,
  },
  highlightBox: {
    backgroundColor: Colors.errorLight,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.lg,
  },
  highlightTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.sm,
  },
  highlightText: {
    fontSize: Theme.fontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  effectiveDate: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textTertiary,
    marginBottom: Theme.spacing.md,
  },
  paragraph: {
    fontSize: Theme.fontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Theme.spacing.md,
  },
  infoBox: {
    backgroundColor: Colors.infoLight,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.lg,
  },
  infoTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.sm,
  },
  infoText: {
    fontSize: Theme.fontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
  },
  subsectionTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textPrimary,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  bulletList: {
    marginLeft: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  bullet: {
    fontSize: Theme.fontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Theme.spacing.xs,
  },
  bold: {
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
  },
  contactInfo: {
    fontSize: Theme.fontSize.md,
    color: Colors.brand,
    fontWeight: Theme.fontWeight.medium,
    marginBottom: Theme.spacing.md,
    lineHeight: 24,
  },
});

/**
 * Privacy Policy Screen
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

export default function PrivacyPolicyScreen({ navigation }: any) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.subtitle}>How we collect and use your information</Text>
          
          <View style={styles.highlightBox}>
            <Text style={styles.highlightTitle}>Welcome to GoWaay!</Text>
            <Text style={styles.highlightText}>
              GoWaay, a government-licensed proprietorship company ("GoWaay," "we," "us," or "our"), 
              is dedicated to safeguarding the privacy and security of your data and information. We have created 
              this Privacy Policy to help you understand how we collect, store, process, share, and utilize your 
              data and information when you use our Platform and Services.
            </Text>
          </View>

          <Text style={styles.effectiveDate}>
            <Text style={styles.bold}>Effective Date:</Text> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>

          <Text style={styles.paragraph}>
            Terms that are capitalized but not defined in this Privacy Policy have the meanings provided in our 
            Terms & Conditions.
          </Text>

          <Text style={styles.paragraph}>
            Please carefully review the terms outlined below, as they explain how GoWaay collects, stores, 
            processes, shares, and utilizes your data and information in connection with your use of the Platform 
            and Services.
          </Text>

          <Text style={styles.importantNotice}>
            By continuing to use the Platform or access the Services, you acknowledge that you have read, understood, 
            and agree to be legally bound by the provisions of this Privacy Policy and the accompanying Terms & Conditions.
          </Text>

          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>Important Notice:</Text>
            <Text style={styles.warningText}>
              We are not responsible for, and shall not be held liable for, any privacy practices or statements on 
              websites, mobile applications, or platforms not owned, operated, or controlled by us. You acknowledge 
              that GoWaay shall not be held liable for the actions of third-party individuals or entities.
            </Text>
            <Text style={styles.warningText}>
              The Platform may occasionally provide links to third-party websites. If you access those links, you will 
              leave our Platform. We do not control those websites or their privacy practices, which may differ from ours. 
              This Privacy Policy does not cover any personal or identity information you may disclose on third-party websites.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>1. INFORMATION WE COLLECT AND RETAIN</Text>

          <Text style={styles.subsectionTitle}>1.1 Personal Information</Text>
          <Text style={styles.paragraph}>
            We may collect, retain, process, share, and/or utilize information that you provide while using the 
            Platform or accessing the Services. This includes, but is not limited to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Personal and identity information (name, date of birth, gender, occupation, security questions)</Text>
            <Text style={styles.bullet}>• Location and property details (ownership information and historical data)</Text>
            <Text style={styles.bullet}>• Payment information (including payment verification details where applicable)</Text>
            <Text style={styles.bullet}>• Contact details (mobile number, email address, mailing address, office or residential address)</Text>
            <Text style={styles.bullet}>• National Identity Card (NID), passport details, or other government-issued identification documents</Text>
            <Text style={styles.bullet}>• Any other information required by applicable laws, government policies, or necessary to provide Services</Text>
          </View>
          <Text style={styles.paragraph}>
            This information is collectively referred to as <Text style={styles.bold}>"Personal Information."</Text>
          </Text>

          <Text style={styles.subsectionTitle}>1.2 Usage and Interaction Information</Text>
          <Text style={styles.paragraph}>
            We may collect information that you provide when you create an account, make bookings, list properties, 
            communicate with other users, or interact with our platform in any way.
          </Text>

          <Text style={styles.sectionTitle}>2. HOW WE USE YOUR INFORMATION</Text>
          <Text style={styles.paragraph}>
            We use the information we collect to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Provide, maintain, and improve our services</Text>
            <Text style={styles.bullet}>• Process transactions and send related information</Text>
            <Text style={styles.bullet}>• Send administrative information and updates</Text>
            <Text style={styles.bullet}>• Respond to your inquiries and provide customer support</Text>
            <Text style={styles.bullet}>• Detect, prevent, and address technical issues and fraudulent activities</Text>
            <Text style={styles.bullet}>• Comply with legal obligations</Text>
          </View>

          <Text style={styles.sectionTitle}>3. INFORMATION SHARING</Text>
          <Text style={styles.paragraph}>
            We may share your information with:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Other users (as necessary for bookings and transactions)</Text>
            <Text style={styles.bullet}>• Service providers who assist us in operating our platform</Text>
            <Text style={styles.bullet}>• Legal authorities when required by law</Text>
            <Text style={styles.bullet}>• Business partners with your consent</Text>
          </View>

          <Text style={styles.sectionTitle}>4. DATA SECURITY</Text>
          <Text style={styles.paragraph}>
            We implement appropriate technical and organizational measures to protect your personal information against 
            unauthorized access, alteration, disclosure, or destruction.
          </Text>

          <Text style={styles.sectionTitle}>5. YOUR RIGHTS</Text>
          <Text style={styles.paragraph}>
            You have the right to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Access your personal information</Text>
            <Text style={styles.bullet}>• Correct inaccurate information</Text>
            <Text style={styles.bullet}>• Request deletion of your information</Text>
            <Text style={styles.bullet}>• Object to processing of your information</Text>
            <Text style={styles.bullet}>• Withdraw consent where applicable</Text>
          </View>

          <Text style={styles.sectionTitle}>6. CONTACT US</Text>
          <Text style={styles.paragraph}>
            For additional information about our policies and practices regarding the use or control of information you 
            share with us, please contact us at:
          </Text>
          <Text style={styles.contactInfo}>
            Email: support@gowaay.com{'\n'}
            Phone: 01611-553628
          </Text>

          <Text style={styles.paragraph}>
            GoWaay reserves the right to supplement, amend, modify, or update this Privacy Policy at its sole 
            discretion. Any changes shall be deemed effective from the date they are published on the Platform.
          </Text>

          <Text style={styles.paragraph}>
            This Privacy Policy is subject to the applicable laws of Bangladesh and the specific region in which the 
            Platform is accessed or the Services are utilized.
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
    marginBottom: 16,
  },
  highlightBox: {
    backgroundColor: Colors.infoLight,
    borderLeftWidth: 4,
    borderLeftColor: Colors.brand,
    padding: 14,
    borderRadius: Theme.borderRadius.md,
    marginBottom: 14,
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
  importantNotice: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: Theme.fontWeight.medium,
    lineHeight: 22,
    marginBottom: 14,
  },
  warningBox: {
    backgroundColor: Colors.warningLight,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    padding: 14,
    borderRadius: Theme.borderRadius.md,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.sm,
    letterSpacing: -0.2,
  },
  warningText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Theme.spacing.sm,
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

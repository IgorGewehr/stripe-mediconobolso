/**
 * Admin Service
 *
 * Handles admin operations, platform statistics, user management, and reports.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit as limitFn,
  startAfter
} from 'firebase/firestore';
import { BaseService } from './base.service';

class AdminService extends BaseService {
  // ==========================================
  // USER MANAGEMENT
  // ==========================================

  /**
   * List all users for admin
   * @param {number} pageSize - Page size
   * @param {Object} lastUser - Last user for pagination
   * @param {string} searchQuery - Search query
   * @returns {Promise<Array>} List of users
   */
  async listAllUsers(pageSize = 100, lastUser = null, searchQuery = "") {
    try {
      const usersRef = collection(this.firestore, "users");
      let usersQuery;

      if (lastUser) {
        usersQuery = query(
          usersRef,
          orderBy("fullName", "asc"),
          startAfter(lastUser),
          limitFn(pageSize)
        );
      } else if (searchQuery) {
        const upperBound = searchQuery + "\uf8ff";
        const nameQuery = query(
          usersRef,
          where("fullName", ">=", searchQuery),
          where("fullName", "<=", upperBound),
          limitFn(pageSize)
        );
        const emailQuery = query(
          usersRef,
          where("email", ">=", searchQuery),
          where("email", "<=", upperBound),
          limitFn(pageSize)
        );

        const [nameSnap, emailSnap] = await Promise.all([
          getDocs(nameQuery),
          getDocs(emailQuery),
        ]);

        const map = new Map();
        nameSnap.forEach(docSnap => map.set(docSnap.id, { id: docSnap.id, ...docSnap.data() }));
        emailSnap.forEach(docSnap => {
          if (!map.has(docSnap.id)) map.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
        });
        return Array.from(map.values());
      } else {
        usersQuery = query(
          usersRef,
          orderBy("fullName", "asc"),
          limitFn(pageSize)
        );
      }

      const snap = await getDocs(usersQuery);
      const users = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        users.push({
          id: docSnap.id,
          fullName: data.fullName || "",
          email: data.email || "",
          phone: data.phone || "",
          city: data.address?.city || "",
          state: data.address?.state || "",
          cpf: data.cpf || "",
          isAdmin: data.administrador === true,
          photoURL: data.photoURL || "",
          assinouPlano: data.assinouPlano === true,
          createdAt: data.createdAt || null,
        });
      });

      return users;
    } catch (error) {
      this.handleError(error, 'listAllUsers');
    }
  }

  /**
   * Get users with presence data
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Users with enriched data
   */
  async getUsersWithPresenceData(options = {}) {
    try {
      const {
        pageSize = 50,
        searchQuery = "",
        planFilter = "all",
        statusFilter = "all",
        sortBy = "lastLogin",
        sortOrder = "desc"
      } = options;

      this.log('Fetching users with filters:', options);

      const usersRef = collection(this.firestore, "users");
      let usersQuery = query(usersRef);

      if (searchQuery && searchQuery.length > 2) {
        const upperBound = searchQuery + "\uf8ff";
        usersQuery = query(
          usersRef,
          where("fullName", ">=", searchQuery),
          where("fullName", "<=", upperBound)
        );
      }

      const snapshot = await getDocs(usersQuery);
      let users = [];

      snapshot.forEach(docSnap => {
        users.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      this.log(`${users.length} users found before filters`);

      // Apply client-side filters
      users = users.filter(user => {
        if (searchQuery && searchQuery.length > 0) {
          const search = searchQuery.toLowerCase();
          const matchName = user.fullName?.toLowerCase().includes(search);
          const matchEmail = user.email?.toLowerCase().includes(search);
          const matchCPF = user.cpf?.includes(search);
          if (!matchName && !matchEmail && !matchCPF) return false;
        }

        if (planFilter !== "all") {
          switch (planFilter) {
            case "admin":
              if (!user.administrador) return false;
              break;
            case "premium":
              if (!user.assinouPlano) return false;
              break;
            case "free":
              if (!user.gratuito && !user.administrador) return false;
              break;
          }
        }

        if (statusFilter !== "all") {
          const now = Date.now();
          const lastLogin = user.lastLogin ?
            (user.lastLogin.toDate ? user.lastLogin.toDate() : new Date(user.lastLogin)) : null;
          const timeSinceLogin = lastLogin ? now - lastLogin.getTime() : Infinity;
          const hoursOffline = timeSinceLogin / (1000 * 60 * 60);

          switch (statusFilter) {
            case "online":
              if (!user.isCurrentlyOnline) return false;
              break;
            case "offline":
              if (user.isCurrentlyOnline) return false;
              break;
            case "recent":
              if (hoursOffline > 24) return false;
              break;
          }
        }

        return true;
      });

      const enrichedUsers = await Promise.all(
        users.slice(0, pageSize).map(async (user) => {
          return await this.enrichUserData(user);
        })
      );

      enrichedUsers.sort((a, b) => {
        let aValue, bValue;
        switch (sortBy) {
          case "lastLogin":
            aValue = a.lastLogin ? new Date(a.lastLogin) : new Date(0);
            bValue = b.lastLogin ? new Date(b.lastLogin) : new Date(0);
            break;
          case "createdAt":
            aValue = a.createdAt ? new Date(a.createdAt) : new Date(0);
            bValue = b.createdAt ? new Date(b.createdAt) : new Date(0);
            break;
          case "fullName":
            aValue = a.fullName || "";
            bValue = b.fullName || "";
            return sortOrder === "asc" ?
              aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
          default:
            aValue = a.lastLogin ? new Date(a.lastLogin) : new Date(0);
            bValue = b.lastLogin ? new Date(b.lastLogin) : new Date(0);
        }

        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      });

      this.log(`Returning ${enrichedUsers.length} processed users`);
      return {
        users: enrichedUsers,
        totalCount: users.length,
        hasMore: users.length > pageSize
      };

    } catch (error) {
      this.handleError(error, 'getUsersWithPresenceData');
    }
  }

  /**
   * Enrich user data with calculated fields
   * @param {Object} user - User data
   * @returns {Promise<Object>} Enriched user data
   */
  async enrichUserData(user) {
    try {
      const enrichedUser = { ...user };

      // Determine plan type
      if (user.administrador) {
        enrichedUser.planType = 'Admin';
        enrichedUser.planColor = 'error';
        enrichedUser.planIcon = 'admin';
      } else if (user.assinouPlano) {
        enrichedUser.planType = user.planType || 'Premium';
        enrichedUser.planColor = 'primary';
        enrichedUser.planIcon = 'premium';
      } else {
        enrichedUser.planType = 'Free';
        enrichedUser.planColor = 'default';
        enrichedUser.planIcon = 'free';
      }

      enrichedUser.isOnline = user.isCurrentlyOnline === true;

      // Calculate time since last login
      if (user.lastLogin) {
        const lastLogin = user.lastLogin.toDate ? user.lastLogin.toDate() : new Date(user.lastLogin);
        const now = Date.now();
        const diffMs = now - lastLogin.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 5) {
          enrichedUser.lastSeenText = 'Just now';
          enrichedUser.lastSeenColor = 'success';
        } else if (diffMins < 60) {
          enrichedUser.lastSeenText = `${diffMins}min ago`;
          enrichedUser.lastSeenColor = 'success';
        } else if (diffHours < 24) {
          enrichedUser.lastSeenText = `${diffHours}h ago`;
          enrichedUser.lastSeenColor = 'warning';
        } else if (diffDays < 7) {
          enrichedUser.lastSeenText = `${diffDays}d ago`;
          enrichedUser.lastSeenColor = 'warning';
        } else {
          enrichedUser.lastSeenText = lastLogin.toLocaleDateString('pt-BR');
          enrichedUser.lastSeenColor = 'default';
        }
      } else {
        enrichedUser.lastSeenText = 'Never';
        enrichedUser.lastSeenColor = 'error';
      }

      // Calculate account age
      if (user.createdAt) {
        const createdAt = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        const diffDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          enrichedUser.accountAge = 'Today';
        } else if (diffDays === 1) {
          enrichedUser.accountAge = 'Yesterday';
        } else if (diffDays < 30) {
          enrichedUser.accountAge = `${diffDays}d`;
        } else if (diffDays < 365) {
          const months = Math.floor(diffDays / 30);
          enrichedUser.accountAge = `${months}mo`;
        } else {
          const years = Math.floor(diffDays / 365);
          enrichedUser.accountAge = `${years}y`;
        }
      } else {
        enrichedUser.accountAge = 'N/A';
      }

      // Referral source
      if (user.enrico) {
        enrichedUser.referralDisplay = 'Enrico';
        enrichedUser.referralColor = 'primary';
      } else if (user.referralSource) {
        enrichedUser.referralDisplay = user.referralSource;
        enrichedUser.referralColor = 'secondary';
      } else {
        enrichedUser.referralDisplay = 'Direct';
        enrichedUser.referralColor = 'default';
      }

      return enrichedUser;
    } catch (error) {
      this.warn(`Error enriching user ${user.id}:`, error);
      return user;
    }
  }

  /**
   * Get detailed user statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Detailed statistics
   */
  async getUserDetailedStats(userId) {
    try {
      this.log(`Fetching detailed stats for user: ${userId}`);

      const userDoc = await getDoc(doc(this.firestore, "users", userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      const userData = userDoc.data();

      const patientsSnapshot = await getDocs(collection(this.firestore, "users", userId, "patients"));
      const patientIds = [];
      patientsSnapshot.forEach(docSnap => {
        patientIds.push(docSnap.id);
      });

      let totalConsultations = 0;
      let totalPrescriptions = 0;
      let totalExams = 0;
      let totalNotes = 0;
      const allConsultations = [];

      const batchSize = 10;
      for (let i = 0; i < patientIds.length; i += batchSize) {
        const batch = patientIds.slice(i, i + batchSize);
        const batchPromises = batch.map(async (patientId) => {
          try {
            const consultationsRef = collection(this.firestore, "users", userId, "patients", patientId, "consultations");
            const consultationsSnapshot = await getDocs(consultationsRef);

            consultationsSnapshot.forEach(docSnap => {
              totalConsultations++;
              allConsultations.push({
                id: docSnap.id,
                patientId: patientId,
                ...docSnap.data()
              });
            });

            const prescriptionsRef = collection(this.firestore, "users", userId, "patients", patientId, "prescriptions");
            const prescriptionsSnapshot = await getDocs(prescriptionsRef);
            totalPrescriptions += prescriptionsSnapshot.size;

            const examsRef = collection(this.firestore, "users", userId, "patients", patientId, "exams");
            const examsSnapshot = await getDocs(examsRef);
            totalExams += examsSnapshot.size;

            const notesRef = collection(this.firestore, "users", userId, "patients", patientId, "notes");
            const notesSnapshot = await getDocs(notesRef);
            totalNotes += notesSnapshot.size;

          } catch (error) {
            this.warn(`Error processing patient ${patientId}:`, error);
          }
        });

        await Promise.all(batchPromises);
      }

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisYear = new Date(now.getFullYear(), 0, 1);

      const consultationsThisMonth = allConsultations.filter(c => {
        if (!c.consultationDate) return false;
        const date = typeof c.consultationDate === 'string' ?
          new Date(c.consultationDate) : c.consultationDate.toDate();
        return date >= thisMonth;
      }).length;

      const consultationsLastMonth = allConsultations.filter(c => {
        if (!c.consultationDate) return false;
        const date = typeof c.consultationDate === 'string' ?
          new Date(c.consultationDate) : c.consultationDate.toDate();
        return date >= lastMonth && date < thisMonth;
      }).length;

      const consultationsThisYear = allConsultations.filter(c => {
        if (!c.consultationDate) return false;
        const date = typeof c.consultationDate === 'string' ?
          new Date(c.consultationDate) : c.consultationDate.toDate();
        return date >= thisYear;
      }).length;

      const upcomingConsultations = allConsultations
        .filter(c => {
          if (!c.consultationDate) return false;
          const date = typeof c.consultationDate === 'string' ?
            new Date(c.consultationDate) : c.consultationDate.toDate();
          return date >= now;
        })
        .sort((a, b) => {
          const dateA = typeof a.consultationDate === 'string' ?
            new Date(a.consultationDate) : a.consultationDate.toDate();
          const dateB = typeof b.consultationDate === 'string' ?
            new Date(b.consultationDate) : b.consultationDate.toDate();
          return dateA - dateB;
        })
        .slice(0, 3);

      let registrationTime = 'Not available';
      let daysSinceRegistration = null;
      if (userData.createdAt) {
        const createdAt = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt);
        daysSinceRegistration = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        registrationTime = createdAt.toLocaleDateString('pt-BR');
      }

      let lastLoginFormatted = 'Never';
      let daysSinceLastLogin = null;
      if (userData.lastLogin) {
        const lastLogin = userData.lastLogin.toDate ? userData.lastLogin.toDate() : new Date(userData.lastLogin);
        lastLoginFormatted = lastLogin.toLocaleString('pt-BR');
        daysSinceLastLogin = Math.floor((Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
      }

      const stats = {
        userData,
        patientsCount: patientIds.length,
        consultationsCount: totalConsultations,
        prescriptionsCount: totalPrescriptions,
        examsCount: totalExams,
        notesCount: totalNotes,
        consultationsThisMonth,
        consultationsLastMonth,
        consultationsThisYear,
        upcomingConsultations,
        registrationTime,
        daysSinceRegistration,
        lastLoginFormatted,
        daysSinceLastLogin,
        isCurrentlyOnline: userData.isCurrentlyOnline || false,
        loginCount: userData.loginCount || 0,
        lastUserAgent: userData.lastUserAgent || 'Not available',
        lastLoginMethod: userData.lastLoginMethod || 'email',
        referralSource: userData.referralSource || null,
        isEnricoUser: userData.enrico === true,
        monthlyGrowth: consultationsThisMonth - consultationsLastMonth,
        monthlyGrowthPercent: consultationsLastMonth > 0 ?
          Math.round(((consultationsThisMonth - consultationsLastMonth) / consultationsLastMonth) * 100) :
          (consultationsThisMonth > 0 ? 100 : 0)
      };

      this.log(`Stats calculated for ${userId}`);
      return stats;

    } catch (error) {
      this.handleError(error, 'getUserDetailedStats');
    }
  }

  // ==========================================
  // PLATFORM STATISTICS
  // ==========================================

  /**
   * Get enhanced platform statistics
   * @returns {Promise<Object>} Platform statistics
   */
  async getEnhancedPlatformStats() {
    try {
      this.log('Calculating enhanced platform stats...');

      const usersRef = collection(this.firestore, "users");
      const allUsersSnapshot = await getDocs(usersRef);

      const stats = {
        totalUsers: 0,
        adminUsers: 0,
        paidUsers: 0,
        freeUsers: 0,
        onlineUsers: 0,
        newUsersToday: 0,
        newUsersThisWeek: 0,
        newUsersThisMonth: 0,
        activeUsersToday: 0,
        activeUsersThisWeek: 0,
        activeUsersThisMonth: 0,
        enricoUsers: 0,
        usersActive7Days: 0,
        usersActive30Days: 0,
        dormantUsers: 0,
        planDistribution: {
          free: 0,
          monthly: 0,
          quarterly: 0,
          annual: 0,
          admin: 0
        }
      };

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      allUsersSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        stats.totalUsers++;

        if (data.administrador === true) {
          stats.adminUsers++;
          stats.planDistribution.admin++;
        } else if (data.assinouPlano === true) {
          stats.paidUsers++;
          switch (data.planType) {
            case 'monthly':
              stats.planDistribution.monthly++;
              break;
            case 'quarterly':
              stats.planDistribution.quarterly++;
              break;
            case 'annual':
              stats.planDistribution.annual++;
              break;
            default:
              stats.planDistribution.monthly++;
          }
        } else {
          stats.freeUsers++;
          stats.planDistribution.free++;
        }

        if (data.isCurrentlyOnline === true) {
          stats.onlineUsers++;
        }

        if (data.enrico === true) {
          stats.enricoUsers++;
        }

        if (data.createdAt) {
          const createdAt = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          if (createdAt >= todayStart) stats.newUsersToday++;
          if (createdAt >= weekStart) stats.newUsersThisWeek++;
          if (createdAt >= monthStart) stats.newUsersThisMonth++;
        }

        if (data.lastLogin) {
          const lastLogin = data.lastLogin.toDate ? data.lastLogin.toDate() : new Date(data.lastLogin);
          if (lastLogin >= todayStart) stats.activeUsersToday++;
          if (lastLogin >= weekStart) stats.activeUsersThisWeek++;
          if (lastLogin >= monthStart) stats.activeUsersThisMonth++;
          if (lastLogin >= sevenDaysAgo) stats.usersActive7Days++;
          if (lastLogin >= thirtyDaysAgo) stats.usersActive30Days++;
          if (lastLogin < thirtyDaysAgo) stats.dormantUsers++;
        } else {
          stats.dormantUsers++;
        }
      });

      stats.percentages = {
        adminUsers: ((stats.adminUsers / stats.totalUsers) * 100).toFixed(1),
        paidUsers: ((stats.paidUsers / stats.totalUsers) * 100).toFixed(1),
        freeUsers: ((stats.freeUsers / stats.totalUsers) * 100).toFixed(1),
        onlineUsers: ((stats.onlineUsers / stats.totalUsers) * 100).toFixed(1),
        enricoUsers: ((stats.enricoUsers / stats.totalUsers) * 100).toFixed(1),
        retention7Days: ((stats.usersActive7Days / stats.totalUsers) * 100).toFixed(1),
        retention30Days: ((stats.usersActive30Days / stats.totalUsers) * 100).toFixed(1)
      };

      this.log('Platform stats calculated');
      return stats;

    } catch (error) {
      this.handleError(error, 'getEnhancedPlatformStats');
    }
  }

  /**
   * Update user admin status
   * @param {string} userId - User ID
   * @param {boolean} isAdmin - Admin status
   * @returns {Promise<boolean>}
   */
  async updateUserAdminStatus(userId, isAdmin) {
    try {
      this.log(`Updating admin status for user ${userId} to: ${isAdmin}`);

      const userRef = doc(this.firestore, "users", userId);
      const updateData = {
        administrador: isAdmin,
        updatedAt: new Date()
      };

      if (!isAdmin) {
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        if (!userData.assinouPlano) {
          updateData.gratuito = true;
          updateData.planType = 'free';
        }
      } else {
        updateData.assinouPlano = false;
        updateData.gratuito = false;
        updateData.planType = 'admin';
      }

      await updateDoc(userRef, updateData);
      this.log(`Admin status updated for user ${userId}`);
      return true;
    } catch (error) {
      this.handleError(error, 'updateUserAdminStatus');
    }
  }

  // ==========================================
  // REPORTS & MESSAGING
  // ==========================================

  /**
   * Get all user messages
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} All messages
   */
  async getAllUsersMessages(filters = {}) {
    try {
      this.log('Fetching all user messages...');

      const usersRef = collection(this.firestore, "users");
      const usersSnapshot = await getDocs(usersRef);

      const allMessages = [];

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();

        try {
          const messagesRef = collection(this.firestore, "users", userId, "messages");
          let q = query(messagesRef, orderBy("updatedAt", "desc"));

          if (filters.status) {
            q = query(messagesRef, where("status", "==", filters.status), orderBy("updatedAt", "desc"));
          }

          const messagesSnapshot = await getDocs(q);

          messagesSnapshot.forEach(messageDoc => {
            const messageData = messageDoc.data();
            if (messageData && messageDoc.id) {
              allMessages.push({
                ...messageData,
                id: messageDoc.id,
                userId: userId,
                userName: userData.fullName || userData.email || 'Anonymous User',
                userEmail: userData.email || 'Email not provided'
              });
            }
          });
        } catch (userError) {
          this.warn(`Error fetching messages for user ${userId}:`, userError);
        }
      }

      allMessages.sort((a, b) => {
        const dateA = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt || 0);
        const dateB = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(b.updatedAt || 0);
        return dateB - dateA;
      });

      this.log(`Total messages collected: ${allMessages.length}`);
      return allMessages;
    } catch (error) {
      console.error("[AdminService] Error fetching all messages:", error);
      return [];
    }
  }

  /**
   * Create report/ticket
   * @param {string} userId - User ID
   * @param {Object} reportData - Report data
   * @returns {Promise<string>} Report ID
   */
  async createReport(userId, reportData) {
    try {
      if (!userId || !reportData?.subject || !reportData?.content) {
        throw new Error('userId, subject and content are required');
      }

      this.log(`Creating report for user ${userId}...`);

      let userData = { fullName: 'User', email: 'user@example.com' };
      try {
        const userDoc = await getDoc(doc(this.firestore, "users", userId));
        if (userDoc.exists()) {
          userData = userDoc.data();
        }
      } catch (error) {
        this.warn("Using default user data:", error.message);
      }

      const reportRef = doc(collection(this.firestore, "reports"));

      const newReport = {
        id: reportRef.id,
        userId: userId,
        userName: userData.fullName || userData.email || 'Anonymous User',
        userEmail: userData.email || 'user@example.com',
        subject: reportData.subject.trim(),
        content: reportData.content.trim(),
        type: reportData.type || 'support',
        status: 'new',
        priority: reportData.priority || 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
        responses: [],
        hasUnreadResponses: false,
        hasUnreadFromUser: true,
        lastResponseAt: null
      };

      await setDoc(reportRef, newReport);
      this.log('Report created:', reportRef.id);
      return reportRef.id;
    } catch (error) {
      this.handleError(error, 'createReport');
    }
  }

  /**
   * Get user reports
   * @param {string} userId - User ID
   * @returns {Promise<Array>} User reports
   */
  async getUserReports(userId) {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      this.log(`Fetching reports for user ${userId}...`);

      const reportsRef = collection(this.firestore, "reports");
      const q = query(
        reportsRef,
        where("userId", "==", userId),
        orderBy("updatedAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const reports = [];

      querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.userId === userId) {
          reports.push({
            id: docSnap.id,
            ...data
          });
        }
      });

      this.log(`${reports.length} reports found`);
      return reports;
    } catch (error) {
      console.error("[AdminService] Error fetching user reports:", error);
      return [];
    }
  }

  /**
   * Add response to report
   * @param {string} reportId - Report ID
   * @param {Object} responseData - Response data
   * @returns {Promise<string>} Response ID
   */
  async addReportResponse(reportId, responseData) {
    try {
      if (!reportId || !responseData?.content) {
        throw new Error('reportId and content are required');
      }

      this.log(`Adding response to report ${reportId}...`);

      const reportRef = doc(this.firestore, "reports", reportId);
      const reportDoc = await getDoc(reportRef);

      if (!reportDoc.exists()) {
        throw new Error("Report not found");
      }

      const reportData = reportDoc.data();
      const responses = reportData.responses || [];

      const newResponse = {
        id: Date.now().toString(),
        content: responseData.content.trim(),
        isAdmin: responseData.isAdmin || false,
        authorId: responseData.authorId,
        authorName: responseData.authorName,
        createdAt: new Date()
      };

      responses.push(newResponse);

      const updateData = {
        responses: responses,
        updatedAt: new Date(),
        lastResponseAt: new Date()
      };

      if (responseData.isAdmin) {
        updateData.status = 'in_progress';
        updateData.hasUnreadResponses = true;
        updateData.hasUnreadFromUser = false;
      } else {
        updateData.hasUnreadFromUser = true;
        updateData.hasUnreadResponses = false;
      }

      await updateDoc(reportRef, updateData);
      this.log('Response added to report');
      return newResponse.id;
    } catch (error) {
      this.handleError(error, 'addReportResponse');
    }
  }

  /**
   * Get all reports
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} All reports
   */
  async getAllReports(filters = {}) {
    try {
      this.log('Fetching all reports...');

      let reportsQuery = collection(this.firestore, "reports");
      let queryConstraints = [];

      if (filters.status && filters.status !== 'all') {
        queryConstraints.push(where("status", "==", filters.status));
      }

      if (filters.type && filters.type !== 'all') {
        queryConstraints.push(where("type", "==", filters.type));
      }

      if (filters.priority && filters.priority !== 'all') {
        queryConstraints.push(where("priority", "==", filters.priority));
      }

      if (filters.hasUnreadFromUser === true) {
        queryConstraints.push(where("hasUnreadFromUser", "==", true));
      }

      queryConstraints.push(orderBy("updatedAt", "desc"));

      if (filters.limit) {
        queryConstraints.push(limitFn(filters.limit));
      }

      const q = query(reportsQuery, ...queryConstraints);
      const querySnapshot = await getDocs(q);

      const reports = [];
      querySnapshot.forEach(docSnap => {
        reports.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      this.log(`${reports.length} reports found`);
      return reports;
    } catch (error) {
      console.error("[AdminService] Error fetching reports:", error);
      return [];
    }
  }

  /**
   * Update report status
   * @param {string} reportId - Report ID
   * @param {string} status - New status
   * @param {string} updatedBy - User who updated
   * @returns {Promise<boolean>}
   */
  async updateReportStatus(reportId, status, updatedBy = null) {
    try {
      if (!reportId || !status) {
        throw new Error('reportId and status are required');
      }

      this.log(`Updating report ${reportId} status to ${status}...`);

      const reportRef = doc(this.firestore, "reports", reportId);
      const updateData = {
        status: status,
        updatedAt: new Date()
      };

      if (updatedBy) {
        updateData.lastUpdatedBy = updatedBy;
      }

      if (status === 'resolved') {
        updateData.hasUnreadResponses = false;
        updateData.hasUnreadFromUser = false;
      }

      await updateDoc(reportRef, updateData);
      this.log('Report status updated');
      return true;
    } catch (error) {
      console.error("[AdminService] Error updating report status:", error);
      return false;
    }
  }

  /**
   * Mark report as read by user
   * @param {string} reportId - Report ID
   * @returns {Promise<boolean>}
   */
  async markReportAsReadByUser(reportId) {
    try {
      if (!reportId) {
        throw new Error('reportId is required');
      }

      const reportRef = doc(this.firestore, "reports", reportId);
      await updateDoc(reportRef, {
        hasUnreadResponses: false,
        updatedAt: new Date()
      });

      return true;
    } catch (error) {
      console.error("[AdminService] Error marking report as read:", error);
      return false;
    }
  }

  /**
   * Mark report as read by admin
   * @param {string} reportId - Report ID
   * @returns {Promise<boolean>}
   */
  async markReportAsReadByAdmin(reportId) {
    try {
      if (!reportId) {
        throw new Error('reportId is required');
      }

      const reportRef = doc(this.firestore, "reports", reportId);
      await updateDoc(reportRef, {
        hasUnreadFromUser: false,
        updatedAt: new Date()
      });

      return true;
    } catch (error) {
      console.error("[AdminService] Error marking report as read by admin:", error);
      return false;
    }
  }

  /**
   * Get reports statistics
   * @returns {Promise<Object>} Reports statistics
   */
  async getReportsStats() {
    try {
      this.log('Calculating reports statistics...');

      const allReports = await this.getAllReports({ limit: 1000 });

      const stats = {
        total: allReports.length,
        new: allReports.filter(r => r.status === 'new').length,
        inProgress: allReports.filter(r => r.status === 'in_progress').length,
        resolved: allReports.filter(r => r.status === 'resolved').length,
        unreadByAdmin: allReports.filter(r => r.hasUnreadFromUser === true).length,
        byType: {
          support: allReports.filter(r => r.type === 'support').length,
          feedback: allReports.filter(r => r.type === 'feedback').length,
          bug: allReports.filter(r => r.type === 'bug').length,
          system: allReports.filter(r => r.type === 'system').length
        },
        byPriority: {
          low: allReports.filter(r => r.priority === 'low').length,
          medium: allReports.filter(r => r.priority === 'medium').length,
          high: allReports.filter(r => r.priority === 'high').length
        }
      };

      this.log('Reports statistics calculated');
      return stats;
    } catch (error) {
      console.error("[AdminService] Error fetching reports stats:", error);
      return {
        total: 0,
        new: 0,
        inProgress: 0,
        resolved: 0,
        unreadByAdmin: 0,
        byType: { support: 0, feedback: 0, bug: 0, system: 0 },
        byPriority: { low: 0, medium: 0, high: 0 }
      };
    }
  }

  /**
   * Get specific report
   * @param {string} reportId - Report ID
   * @returns {Promise<Object|null>} Report data
   */
  async getReport(reportId) {
    try {
      if (!reportId) {
        throw new Error('reportId is required');
      }

      const reportDoc = await getDoc(doc(this.firestore, "reports", reportId));

      if (!reportDoc.exists()) {
        return null;
      }

      return {
        id: reportDoc.id,
        ...reportDoc.data()
      };
    } catch (error) {
      console.error("[AdminService] Error fetching report:", error);
      return null;
    }
  }

  // ==========================================
  // ADMIN CONVERSATIONS
  // ==========================================

  /**
   * Get admin-user conversation
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Conversation
   */
  async getAdminUserConversation(userId) {
    try {
      this.log(`Fetching admin-user conversation for ${userId}...`);

      const reports = await this.getAllReports({
        type: 'admin_chat'
      });

      const userConversations = reports.filter(report =>
        report.userId === userId && report.type === 'admin_chat'
      );

      const conversation = userConversations.length > 0 ?
        userConversations.sort((a, b) => {
          const dateA = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt || 0);
          const dateB = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(b.updatedAt || 0);
          return dateB - dateA;
        })[0] : null;

      return conversation;
    } catch (error) {
      this.handleError(error, 'getAdminUserConversation');
    }
  }

  /**
   * Create admin-user conversation
   * @param {string} userId - User ID
   * @param {string} initialMessage - Initial message
   * @param {Object} adminInfo - Admin information
   * @returns {Promise<string>} Conversation ID
   */
  async createAdminUserConversation(userId, initialMessage, adminInfo) {
    try {
      this.log(`Creating admin->user conversation for ${userId}...`);

      const reportId = await this.createReport(userId, {
        subject: "Conversation initiated by administrator",
        content: initialMessage,
        type: "admin_chat",
        priority: "medium",
        isAdminInitiated: true,
        adminInitiatorId: adminInfo.uid,
        adminInitiatorName: adminInfo.fullName || 'Administrator'
      });

      this.log('Admin conversation created:', reportId);
      return reportId;
    } catch (error) {
      this.handleError(error, 'createAdminUserConversation');
    }
  }

  /**
   * Send admin message
   * @param {string} conversationId - Conversation ID
   * @param {string} message - Message content
   * @param {Object} adminInfo - Admin information
   * @returns {Promise<void>}
   */
  async sendAdminMessage(conversationId, message, adminInfo) {
    try {
      this.log(`Sending admin message to conversation ${conversationId}...`);

      await this.addReportResponse(conversationId, {
        content: message,
        isAdmin: true,
        authorId: adminInfo.uid,
        authorName: adminInfo.fullName || 'Administrator'
      });

      this.log('Admin message sent');
    } catch (error) {
      this.handleError(error, 'sendAdminMessage');
    }
  }

  /**
   * Get all admin-user conversations
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Conversations
   */
  async getAllAdminUserConversations(filters = {}) {
    try {
      this.log('Fetching all admin-user conversations...');

      const allFilters = {
        ...filters,
        type: 'admin_chat'
      };

      const conversations = await this.getAllReports(allFilters);
      this.log(`${conversations.length} admin conversations found`);
      return conversations;
    } catch (error) {
      console.error("[AdminService] Error fetching admin conversations:", error);
      return [];
    }
  }
}

export const adminService = new AdminService();
export default adminService;

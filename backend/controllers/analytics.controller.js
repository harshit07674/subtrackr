import subscriptionModel from "../models/subscription.model.js";
import workspaceModel from "../models/workspace.model.js";
import userModel from "../models/user.model.js";
import { getExchangeRatesMap, convertCurrency } from "../jobs/currencyFetch.js";

const CATEGORY_COLORS = {
  'Entertainment & Streaming': '#6366f1',
  'AI & Automation': '#a855f7',
  'Developer Tools & Cloud': '#06b6d4',
  'Productivity & Work': '#10b981',
  'Design & Creative': '#ec4899',
  'Utilities & Security': '#f59e0b',
  'Entertainment': '#3b82f6',
  'Productivity': '#14b8a6',
  'Music': '#f43f5e',
  'Gaming': '#8b5cf6',
  'Other': '#64748b'
};

function calculateMonthlyCost(price, billingCycle) {
  const cycle = (billingCycle || 'monthly').toLowerCase();
  switch (cycle) {
    case 'yearly':
      return price / 12;
    case 'weekly':
      return (price * 52) / 12;
    case 'daily':
      return price * 30.4375;
    case 'monthly':
    default:
      return price;
  }
}

export async function getAnalytics(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ status: '401', message: 'Unauthorized' });
    }

    const { workSpaceId } = req.query;

    const user = await userModel.findById(req.user._id);
    const targetCurrency = user?.primaryCurrency || 'USD';

    // Fetch live exchange rates map
    const ratesMap = await getExchangeRatesMap();

    // Query subscriptions
    const query = { userId: req.user._id };
    if (workSpaceId && workSpaceId !== 'all') {
      query.workSpaceId = workSpaceId;
    }

    const subscriptions = await subscriptionModel.find(query);

    // Optional workspace details
    let workspaceInfo = null;
    if (workSpaceId && workSpaceId !== 'all') {
      workspaceInfo = await workspaceModel.findOne({ _id: workSpaceId, userId: req.user._id });
    }

    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 86400000);

    // 1. KPIs Calculation
    let totalMonthlySpend = 0;
    let activeSubsCount = 0;
    let upcomingRenewalsCount = 0;
    let freeTrialCount = 0;

    const paymentGroupMap = {};
    const categoryMap = {};

    subscriptions.forEach((sub) => {
      const status = (sub.status || 'active').toLowerCase();
      const isSubActive = status !== 'cancelled' && status !== 'paused';

      if (sub.isFreeTrial) {
        freeTrialCount++;
      }

      if (isSubActive) {
        activeSubsCount++;
        const mCost = calculateMonthlyCost(sub.price || 0, sub.billingCycle);
        const convertedCost = convertCurrency(mCost, sub.currency, targetCurrency, ratesMap);
        totalMonthlySpend += convertedCost;

        // Payment Group Aggregation
        const pm = (sub.paymentMethod || 'Other').trim();
        if (!paymentGroupMap[pm]) {
          paymentGroupMap[pm] = { amount: 0, count: 0 };
        }
        paymentGroupMap[pm].amount += convertedCost;
        paymentGroupMap[pm].count++;

        // Category Aggregation
        const cat = (sub.category || 'Other').trim();
        if (!categoryMap[cat]) {
          categoryMap[cat] = { amount: 0, count: 0 };
        }
        categoryMap[cat].amount += convertedCost;
        categoryMap[cat].count++;
      }

      // Renewal Check within 30 days
      const rDate = new Date(sub.renewalDate);
      if (rDate >= now && rDate <= thirtyDaysLater) {
        upcomingRenewalsCount++;
      }
    });

    // 2. Format Payment Group Distribution
    const totalPaymentAmount = Object.values(paymentGroupMap).reduce((acc, curr) => acc + curr.amount, 0);
    const expensesByPaymentGroup = Object.entries(paymentGroupMap).map(([method, data]) => ({
      paymentMethod: method,
      amount: Number(data.amount.toFixed(2)),
      currency: targetCurrency,
      count: data.count,
      percentage: totalPaymentAmount > 0 ? Number(((data.amount / totalPaymentAmount) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.amount - a.amount);

    // 3. Format Category Breakdown
    const categoryBreakdown = Object.entries(categoryMap).map(([catName, data]) => ({
      category: catName,
      amount: Number(data.amount.toFixed(2)),
      currency: targetCurrency,
      count: data.count,
      percentage: totalMonthlySpend > 0 ? Number(((data.amount / totalMonthlySpend) * 100).toFixed(1)) : 0,
      color: CATEGORY_COLORS[catName] || '#94a3b8',
    })).sort((a, b) => b.amount - a.amount);

    // 4. Spending Trends (Past 6 Months Historical Outflow)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const spendingTrends = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mLabel = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      
      // Calculate active subscriptions for that historical window
      let historicalSpend = 0;
      subscriptions.forEach((sub) => {
        const subCreated = new Date(sub.createdAt || 0);
        if (subCreated <= new Date(d.getFullYear(), d.getMonth() + 1, 0)) {
          const mCost = calculateMonthlyCost(sub.price || 0, sub.billingCycle);
          historicalSpend += convertCurrency(mCost, sub.currency, targetCurrency, ratesMap);
        }
      });

      spendingTrends.push({
        month: mLabel,
        amount: Number(historicalSpend.toFixed(2)),
        currency: targetCurrency,
      });
    }

    // 5. Future Cash Flow Projections (30 Days, 6 Months, 12 Months)
    let next30DaysCost = 0;
    let next6MonthsCost = 0;
    let next12MonthsCost = 0;

    const monthlyProjectionBreakdown = [];
    for (let m = 0; m < 12; m++) {
      const projDate = new Date(now.getFullYear(), now.getMonth() + m, 1);
      const projLabel = `${monthNames[projDate.getMonth()]} ${projDate.getFullYear()}`;
      monthlyProjectionBreakdown.push({ month: projLabel, amount: 0, currency: targetCurrency });
    }

    subscriptions.forEach((sub) => {
      const status = (sub.status || 'active').toLowerCase();
      const isSubActive = status !== 'cancelled' && status !== 'paused';
      if (!isSubActive) return;

      const convertedPrice = convertCurrency(sub.price || 0, sub.currency, targetCurrency, ratesMap);
      const cycle = (sub.billingCycle || 'monthly').toLowerCase();

      // Projections over 12 months
      for (let m = 0; m < 12; m++) {
        let factor = 0;
        if (cycle === 'monthly') factor = 1;
        else if (cycle === 'yearly') factor = m === 0 ? 1 : 0;
        else if (cycle === 'weekly') factor = 4.33;
        else if (cycle === 'daily') factor = 30.4;

        const mAmount = convertedPrice * factor;
        monthlyProjectionBreakdown[m].amount += mAmount;

        if (m === 0) next30DaysCost += mAmount;
        if (m < 6) next6MonthsCost += mAmount;
        next12MonthsCost += mAmount;
      }
    });

    // Format projection breakdown amounts
    monthlyProjectionBreakdown.forEach((item) => {
      item.amount = Number(item.amount.toFixed(2));
    });

    return res.status(200).json({
      status: '200',
      message: 'Analytics data calculated successfully',
      targetCurrency,
      workspaceInfo,
      kpis: {
        totalMonthlySpend: Number(totalMonthlySpend.toFixed(2)),
        activeSubsCount,
        upcomingRenewalsCount,
        freeTrialCount,
      },
      spendingTrends,
      expensesByPaymentGroup,
      categoryBreakdown,
      projections: {
        next30Days: Number(next30DaysCost.toFixed(2)),
        next6Months: Number(next6MonthsCost.toFixed(2)),
        next12Months: Number(next12MonthsCost.toFixed(2)),
        monthlyBreakdown: monthlyProjectionBreakdown,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: '500',
      message: `Internal server error: ${error.message || error}`,
    });
  }
}

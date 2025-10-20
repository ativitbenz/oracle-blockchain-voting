import { useState, useEffect } from "react";
import * as api from "../services/api";

// Calculate time remaining
const calculateTimeRemaining = (endTime) => {
  const now = new Date();
  const end = new Date(endTime);
  const diffTime = end - now;

  if (diffTime <= 0) {
    return "Voting closed";
  }

  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.ceil(diffTime / (1000 * 60));

  if (diffDays > 1) {
    return `${diffDays} days`;
  } else if (diffHours > 1) {
    return `${diffHours} hours`;
  } else {
    return `${diffMinutes} minutes`;
  }
};

// Determine poll status
const getPollStatus = (startTime, endTime) => {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (now < start) {
    return "upcoming";
  } else if (now >= start && now <= end) {
    return "active";
  } else {
    return "closed";
  }
};

// Shared state for polls across all components
let pollsData = [];
let transactionsData = [];
let listeners = [];
let transactionListeners = [];
let loadingListeners = [];
let isLoadingPolls = false;
let isLoadingTransactions = false;

// Subscribe to poll changes
const subscribe = (listener) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
};

// Subscribe to transaction changes
const subscribeTransactions = (listener) => {
  transactionListeners.push(listener);
  return () => {
    transactionListeners = transactionListeners.filter((l) => l !== listener);
  };
};

// Subscribe to loading changes
const subscribeLoading = (listener) => {
  loadingListeners.push(listener);
  return () => {
    loadingListeners = loadingListeners.filter((l) => l !== listener);
  };
};

// Notify all listeners
const notifyListeners = () => {
  listeners.forEach((listener) => listener(pollsData));
};

const notifyTransactionListeners = () => {
  transactionListeners.forEach((listener) => listener(transactionsData));
};

const notifyLoadingListeners = () => {
  loadingListeners.forEach((listener) => listener(isLoadingPolls));
};

// Load polls from backend
const loadPolls = async () => {
  if (isLoadingPolls) return;
  isLoadingPolls = true;
  notifyLoadingListeners();

  try {
    const data = await api.getAllPolls();
    pollsData = data.map((poll) => ({
      ...poll,
      timeRemaining: calculateTimeRemaining(poll.endTime),
    }));
    notifyListeners();
  } catch (error) {
    console.error("Error loading polls:", error);
  } finally {
    isLoadingPolls = false;
    notifyLoadingListeners();
  }
};

// Load transactions from backend
const loadTransactions = async () => {
  if (isLoadingTransactions) return;
  isLoadingTransactions = true;

  try {
    const data = await api.getAllTransactions();
    transactionsData = data;
    notifyTransactionListeners();
  } catch (error) {
    console.error("Error loading transactions:", error);
  } finally {
    isLoadingTransactions = false;
  }
};

// Hook for managing polls
export const usePolls = () => {
  const [polls, setPolls] = useState(pollsData);
  const [loading, setLoading] = useState(isLoadingPolls);

  useEffect(() => {
    const handlePollsChange = (newPolls) => {
      setPolls(newPolls);
      setLoading(false);
    };

    const handleLoadingChange = (isLoading) => {
      setLoading(isLoading);
    };

    const unsubscribe = subscribe(handlePollsChange);
    const unsubscribeLoading = subscribeLoading(handleLoadingChange);

    // Load initial data
    if (pollsData.length === 0) {
      setLoading(true);
      loadPolls();
    }

    return () => {
      unsubscribe();
      unsubscribeLoading();
    };
  }, []);

  // Get all polls
  const getAllPolls = () => {
    return polls;
  };

  // Get poll by ID
  const getPollById = async (id, email = null) => {
    try {
      const poll = await api.getPollById(id, email);
      return {
        ...poll,
        timeRemaining: calculateTimeRemaining(poll.endTime),
      };
    } catch (error) {
      console.error("Error getting poll:", error);
      return null;
    }
  };

  // Create new poll
  const createPoll = async (pollData) => {
    try {
      const newPoll = await api.createPoll(pollData);

      // Reload polls to get updated data
      await loadPolls();

      return newPoll;
    } catch (error) {
      console.error("Error creating poll:", error);
      throw error;
    }
  };

  // Verify PIN
  const verifyPin = async (pollId, email, pin) => {
    try {
      const result = await api.verifyPin(pollId, email, pin);
      return result;
    } catch (error) {
      console.error("Error verifying PIN:", error);
      throw error;
    }
  };

  // Resend PIN
  const resendPin = async (pollId, email) => {
    try {
      const result = await api.resendPin(pollId, email);
      return result;
    } catch (error) {
      console.error("Error resending PIN:", error);
      throw error;
    }
  };

  // Submit vote
  const submitVote = async (pollId, optionId, email = null) => {
    try {
      const result = await api.submitVote(pollId, optionId, email);

      // Reload polls and transactions
      await loadPolls();
      await loadTransactions();

      return result;
    } catch (error) {
      console.error("Error submitting vote:", error);
      throw error;
    }
  };

  // Get all transactions
  const getTransactions = async () => {
    if (transactionsData.length === 0) {
      await loadTransactions();
    }
    return transactionsData;
  };

  // Update poll statuses based on current time
  const updatePollStatuses = () => {
    let hasChanges = false;

    pollsData = pollsData.map((poll) => {
      const newStatus = getPollStatus(poll.startTime, poll.endTime);
      const newTimeRemaining = calculateTimeRemaining(poll.endTime);

      if (
        poll.status !== newStatus ||
        poll.timeRemaining !== newTimeRemaining
      ) {
        hasChanges = true;
        return {
          ...poll,
          status: newStatus,
          timeRemaining: newStatus === "closed" ? null : newTimeRemaining,
        };
      }
      return poll;
    });

    if (hasChanges) {
      notifyListeners();
    }
  };

  // Refresh polls manually
  const refreshPolls = async () => {
    await loadPolls();
  };

  return {
    polls,
    loading,
    getAllPolls,
    getPollById,
    createPoll,
    verifyPin,
    resendPin,
    submitVote,
    updatePollStatuses,
    getTransactions,
    refreshPolls,
  };
};

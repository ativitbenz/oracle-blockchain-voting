import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  Plus,
  X,
  Calendar,
  Shield,
  FileText,
  Clock,
  List,
  Mail,
  Loader2,
  Info,
} from "lucide-react";
import { Card, CardBody, Button, Badge } from "../ui";

export const PollCreationForm = forwardRef(
  ({ onSubmit, existingPolls = [], onFormStateChange }, ref) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pollType, setPollType] = useState("public");
    const [formData, setFormData] = useState({
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      recipients: [],
      options: [
        { id: 1, name: "", description: "" },
        { id: 2, name: "", description: "" },
      ],
    });

    const [errors, setErrors] = useState({});
    const [newEmail, setNewEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [activeTooltip, setActiveTooltip] = useState(null);

    // Check if form is complete and valid
    const isFormComplete = () => {
      // Check basic required fields
      const hasTitle = formData.title.trim().length >= 3;
      const hasDescription = formData.description.trim().length >= 10;
      const hasStartTime = formData.startTime !== "";
      const hasEndTime = formData.endTime !== "";

      // Check all options have names
      const allOptionsHaveNames = formData.options.every(
        (opt) => opt.name.trim().length > 0,
      );
      const hasMinimumOptions = formData.options.length >= 2;

      // For private polls, check recipients
      const hasRecipients =
        pollType === "public" || formData.recipients.length > 0;

      // Check no errors exist
      const noErrors = Object.keys(errors).length === 0;

      return (
        hasTitle &&
        hasDescription &&
        hasStartTime &&
        hasEndTime &&
        allOptionsHaveNames &&
        hasMinimumOptions &&
        hasRecipients &&
        noErrors
      );
    };

    // Notify parent component when form state changes
    useEffect(() => {
      if (onFormStateChange) {
        onFormStateChange({
          isComplete: isFormComplete(),
          hasErrors: Object.keys(errors).length > 0,
          isSubmitting,
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData, pollType, errors, isSubmitting]);

    // Check for duplicate title when title changes
    useEffect(() => {
      if (formData.title.trim()) {
        const isDuplicate = existingPolls.some(
          (poll) =>
            poll.title.toLowerCase() === formData.title.trim().toLowerCase(),
        );
        if (isDuplicate) {
          setErrors((prev) => ({
            ...prev,
            title: "A poll with this title already exists",
          }));
        } else {
          setErrors((prev) => {
            const { title, ...rest } = prev;
            return rest;
          });
        }
      }
    }, [formData.title, existingPolls]);

    const handleAddEmail = () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const trimmedEmail = newEmail.trim();

      if (!trimmedEmail) {
        setEmailError("Please enter an email address");
        return;
      }

      if (!emailRegex.test(trimmedEmail)) {
        setEmailError("Invalid email format");
        return;
      }

      if (formData.recipients.includes(trimmedEmail)) {
        setEmailError("Email already added");
        return;
      }

      setFormData({
        ...formData,
        recipients: [...formData.recipients, trimmedEmail],
      });
      setNewEmail("");
      setEmailError("");
    };

    const handleRemoveEmail = (email) => {
      setFormData({
        ...formData,
        recipients: formData.recipients.filter((e) => e !== email),
      });
    };

    const handleAddOption = () => {
      const newOption = {
        id: formData.options.length + 1,
        name: "",
        description: "",
      };
      setFormData({
        ...formData,
        options: [...formData.options, newOption],
      });
    };

    const handleRemoveOption = (id) => {
      if (formData.options.length <= 2) return; // Minimum 2 options
      setFormData({
        ...formData,
        options: formData.options.filter((opt) => opt.id !== id),
      });
    };

    const handleOptionChange = (id, field, value) => {
      const updatedOptions = formData.options.map((opt) =>
        opt.id === id ? { ...opt, [field]: value } : opt,
      );

      setFormData({
        ...formData,
        options: updatedOptions,
      });

      // Real-time validation for options
      if (field === "name") {
        validateOptions(updatedOptions);
      }
    };

    const validateOptions = (options = formData.options) => {
      const fieldErrors = { ...errors };

      const emptyOptions = options.filter((opt) => !opt.name.trim());
      const optionNames = options
        .filter((opt) => opt.name.trim())
        .map((opt) => opt.name.trim().toLowerCase());

      const duplicateOptions = optionNames.filter(
        (name, index, arr) => arr.indexOf(name) !== index,
      );

      if (emptyOptions.length > 0) {
        fieldErrors.options = `All options must have a name (${emptyOptions.length} empty)`;
      } else if (duplicateOptions.length > 0) {
        fieldErrors.options = `Duplicate option names found`;
      } else if (options.length < 2) {
        fieldErrors.options = "At least 2 poll options are required";
      } else {
        delete fieldErrors.options;
      }

      setErrors(fieldErrors);
    };

    const validateForm = () => {
      const newErrors = {};

      // Title validation
      if (!formData.title.trim()) {
        newErrors.title = "Poll title is required";
      } else if (formData.title.trim().length < 3) {
        newErrors.title = "Poll title must be at least 3 characters long";
      } else if (formData.title.trim().length > 100) {
        newErrors.title = "Poll title must be less than 100 characters";
      } else {
        // Check for duplicate title
        const isDuplicate = existingPolls.some(
          (poll) =>
            poll.title.toLowerCase() === formData.title.trim().toLowerCase(),
        );
        if (isDuplicate) {
          newErrors.title = "A poll with this title already exists";
        }
      }

      // Description validation
      if (!formData.description.trim()) {
        newErrors.description = "Description is required";
      } else if (formData.description.trim().length < 10) {
        newErrors.description =
          "Description must be at least 10 characters long";
      } else if (formData.description.trim().length > 500) {
        newErrors.description = "Description must be less than 500 characters";
      }

      // Start time validation
      if (!formData.startTime) {
        newErrors.startTime = "Start time is required";
      } else if (new Date(formData.startTime) < new Date()) {
        newErrors.startTime = "Start time cannot be in the past";
      }

      // End time validation
      if (!formData.endTime) {
        newErrors.endTime = "End time is required";
      } else if (new Date(formData.endTime) <= new Date(formData.startTime)) {
        newErrors.endTime = "End time must be after start time";
      } else if (new Date(formData.endTime) <= new Date()) {
        newErrors.endTime = "End time cannot be in the past";
      }

      // Check for minimum duration (at least 1 hour)
      if (formData.startTime && formData.endTime) {
        const startDateTime = new Date(formData.startTime);
        const endDateTime = new Date(formData.endTime);
        const durationInHours =
          (endDateTime - startDateTime) / (1000 * 60 * 60);

        if (durationInHours < 1) {
          newErrors.endTime = "Poll duration must be at least 1 hour";
        }
      }

      // Only validate recipients for private polls
      if (pollType === "private") {
        if (formData.recipients.length === 0) {
          newErrors.recipients =
            "At least one recipient email is required for private polls";
        } else if (formData.recipients.length > 100) {
          newErrors.recipients = "Cannot add more than 100 recipients";
        }
      }

      // Options validation
      const emptyOptions = formData.options.filter((opt) => !opt.name.trim());
      const optionNames = formData.options
        .filter((opt) => opt.name.trim())
        .map((opt) => opt.name.trim().toLowerCase());

      const duplicateOptions = optionNames.filter(
        (name, index, arr) => arr.indexOf(name) !== index,
      );

      if (emptyOptions.length > 0) {
        newErrors.options = `All options must have a name (${emptyOptions.length} empty)`;
      } else if (duplicateOptions.length > 0) {
        newErrors.options = `Duplicate option names found`;
      } else if (formData.options.length < 2) {
        newErrors.options = "At least 2 poll options are required";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    // Real-time validation for individual fields
    const validateField = (fieldName, value) => {
      const fieldErrors = { ...errors };

      switch (fieldName) {
        case "title":
          if (!value?.trim()) {
            fieldErrors.title = "Poll title is required";
          } else if (value.trim().length < 3) {
            fieldErrors.title = "Poll title must be at least 3 characters long";
          } else if (value.trim().length > 100) {
            fieldErrors.title = "Poll title must be less than 100 characters";
          } else {
            // Check for duplicate title
            const isDuplicate = existingPolls.some(
              (poll) => poll.title.toLowerCase() === value.trim().toLowerCase(),
            );
            if (isDuplicate) {
              fieldErrors.title = "A poll with this title already exists";
            } else {
              delete fieldErrors.title;
            }
          }
          break;

        case "description":
          if (!value?.trim()) {
            fieldErrors.description = "Description is required";
          } else if (value.trim().length < 10) {
            fieldErrors.description =
              "Description must be at least 10 characters long";
          } else if (value.trim().length > 500) {
            fieldErrors.description =
              "Description must be less than 500 characters";
          } else {
            delete fieldErrors.description;
          }
          break;

        case "startTime":
          if (!value) {
            fieldErrors.startTime = "Start time is required";
          } else if (new Date(value) < new Date()) {
            fieldErrors.startTime = "Start time cannot be in the past";
          } else {
            delete fieldErrors.startTime;
            // Revalidate end time if it exists
            if (formData.endTime) {
              validateField("endTime", formData.endTime);
            }
          }
          break;

        case "endTime":
          if (!value) {
            fieldErrors.endTime = "End time is required";
          } else if (
            formData.startTime &&
            new Date(value) <= new Date(formData.startTime)
          ) {
            const startDateTime = new Date(formData.startTime);
            const endDateTime = new Date(value);
            const durationInHours =
              (endDateTime - startDateTime) / (1000 * 60 * 60);

            if (durationInHours < 1) {
              fieldErrors.endTime = "Poll duration must be at least 1 hour";
            } else {
              fieldErrors.endTime = "End time must be after start time";
            }
          } else {
            delete fieldErrors.endTime;
          }
          break;

        default:
          break;
      }

      setErrors(fieldErrors);
    };

    // InfoTooltip component
    const InfoTooltip = ({ id, children }) => (
      <div className="relative inline-block">
        <button
          type="button"
          onMouseEnter={() => setActiveTooltip(id)}
          onMouseLeave={() => setActiveTooltip(null)}
          onClick={() => setActiveTooltip(activeTooltip === id ? null : id)}
          className="p-0.5 hover:bg-slate-200 rounded-full transition-colors"
        >
          <Info className="w-3.5 h-3.5 text-slate-500" />
        </button>
        {activeTooltip === id && (
          <div className="absolute left-0 top-full mt-1 w-64 bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-lg z-20">
            {children}
            <div className="absolute top-0 left-2 transform -translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
          </div>
        )}
      </div>
    );

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (validateForm()) {
        setIsSubmitting(true);
        try {
          await onSubmit({
            ...formData,
            pollType,
            recipients: pollType === "private" ? formData.recipients : [],
          });
        } catch (error) {
          console.error("Error submitting form:", error);
        } finally {
          setIsSubmitting(false);
        }
      }
    };

    // Expose methods for parent component
    useImperativeHandle(
      ref,
      () => ({
        getFormData: () => ({
          ...formData,
          pollType,
          recipients: pollType === "private" ? formData.recipients : [],
        }),
        isValid: () => {
          const isValid = validateForm();
          return isValid;
        },
        isSubmitting,
        hasErrors: Object.keys(errors).length > 0,
        getErrors: () => errors,
        isFormComplete: isFormComplete,
        submitForm: async () => {
          if (validateForm()) {
            setIsSubmitting(true);
            try {
              await onSubmit({
                ...formData,
                pollType,
                recipients: pollType === "private" ? formData.recipients : [],
              });
            } catch (error) {
              console.error("Error submitting form:", error);
              throw error;
            } finally {
              setIsSubmitting(false);
            }
          }
        },
      }),
      [formData, pollType, isSubmitting, errors],
    );

    return (
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        {/* Poll Type Tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setPollType("public")}
            className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
              pollType === "public"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Public Poll
          </button>
          <button
            type="button"
            onClick={() => setPollType("private")}
            className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
              pollType === "private"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Mail className="w-4 h-4 inline mr-2" />
            Private Poll
          </button>
        </div>

        {/* Info Banner */}
        <Card
          className={
            pollType === "public"
              ? "bg-blue-50 border-blue-200"
              : "bg-purple-50 border-purple-200"
          }
        >
          <CardBody className="p-3 md:p-4">
            <div className="flex items-start gap-2 md:gap-3">
              <div className="flex-1">
                <h4
                  className={`font-semibold mb-1 text-sm md:text-base ${pollType === "public" ? "text-blue-900" : "text-purple-900"} flex items-center gap-2`}
                >
                  {pollType === "public" ? "Public Poll" : "Private Poll"}
                  {pollType === "public" && (
                    <InfoTooltip id="publicPollHeaderInfo">
                      Anyone can vote on this poll. All votes are stored
                      permanently in Oracle Blockchain Table.
                    </InfoTooltip>
                  )}
                  {pollType === "private" && (
                    <InfoTooltip id="privatePollHeaderInfo">
                      Only invited recipients can vote. Each recipient will
                      receive a unique PIN via email for verification.
                    </InfoTooltip>
                  )}
                </h4>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Poll Information */}
        <div>
          <h4 className="font-semibold text-slate-900 mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
            <FileText className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            Poll Information
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">
                Poll Title <span className="text-red-500">*</span>
              </label>
              <div className="p-2 md:p-3 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="text"
                  placeholder="e.g., Preferred Database for Next Project"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    validateField("title", e.target.value);
                  }}
                  onBlur={(e) => validateField("title", e.target.value)}
                  className={`w-full bg-transparent text-xs md:text-sm text-slate-900 focus:outline-none ${
                    errors.title ? "border-red-300" : ""
                  }`}
                  required
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.title && (
                    <p className="text-xs md:text-sm text-red-600">
                      {errors.title}
                    </p>
                  )}
                  <span
                    className={`text-xs ml-auto ${
                      formData.title.trim().length > 0 &&
                      formData.title.trim().length < 3
                        ? "text-red-500"
                        : formData.title.trim().length >= 3
                          ? "text-green-500"
                          : "text-slate-400"
                    }`}
                  >
                    {formData.title.trim().length}/100
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <div className="p-2 md:p-3 bg-slate-50 rounded-lg border border-slate-200">
                <textarea
                  placeholder="Provide context and details about this poll..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    validateField("description", e.target.value);
                  }}
                  onBlur={(e) => validateField("description", e.target.value)}
                  className={`w-full bg-transparent text-xs md:text-sm text-slate-900 focus:outline-none resize-none ${
                    errors.description ? "border-red-300" : ""
                  }`}
                  required
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.description && (
                    <p className="text-xs md:text-sm text-red-600">
                      {errors.description}
                    </p>
                  )}
                  <span
                    className={`text-xs ml-auto ${
                      formData.description.trim().length > 0 &&
                      formData.description.trim().length < 10
                        ? "text-red-500"
                        : formData.description.trim().length >= 10
                          ? "text-green-500"
                          : "text-slate-400"
                    }`}
                  >
                    {formData.description.trim().length}/500
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Email Recipients - Only for Private Polls */}
        {pollType === "private" && (
          <div>
            <h4 className="font-semibold text-slate-900 mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
              <Mail className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
              Recipients ({formData.recipients.length})
            </h4>

            {/* Add Email Input */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">
                  Add Email Address <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 p-2 md:p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <input
                      type="email"
                      placeholder="user@example.com"
                      value={newEmail}
                      onChange={(e) => {
                        setNewEmail(e.target.value);
                        setEmailError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddEmail();
                        }
                      }}
                      className="w-full bg-transparent text-xs md:text-sm text-slate-900 focus:outline-none"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddEmail}
                    className="text-xs md:text-sm"
                  >
                    <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 inline mr-1" />
                    Add
                  </Button>
                </div>

                {emailError && (
                  <p className="mt-1 text-xs md:text-sm text-red-600">
                    {emailError}
                  </p>
                )}

                <p className="mt-1 text-xs text-slate-500">
                  Each recipient will receive a unique PIN to vote.
                </p>
              </div>

              {/* Email List */}
              {formData.recipients.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="space-y-2">
                    {formData.recipients.map((email, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-white rounded border border-slate-200"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex-shrink-0 w-6 h-6 bg-white rounded-full flex items-center justify-center font-semibold text-slate-700 border border-slate-300 text-xs">
                            {index + 1}
                          </span>
                          <span className="text-xs md:text-sm text-slate-900">
                            {email}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(email)}
                          className="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.recipients && (
                <p className="text-xs md:text-sm text-red-600">
                  {errors.recipients}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Time Range */}
        <div>
          <h4 className="font-semibold text-slate-900 mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
            <Clock className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
            Schedule
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">
                <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 inline mr-1" />
                Start Time <span className="text-red-500">*</span>
              </label>
              <div className="p-2 md:p-3 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => {
                    setFormData({ ...formData, startTime: e.target.value });
                    validateField("startTime", e.target.value);
                  }}
                  onBlur={(e) => validateField("startTime", e.target.value)}
                  className={`w-full bg-transparent text-xs md:text-sm text-slate-900 focus:outline-none ${
                    errors.startTime ? "border-red-300" : ""
                  }`}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              {errors.startTime && (
                <p className="mt-1 text-xs md:text-sm text-red-600">
                  {errors.startTime}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">
                <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 inline mr-1" />
                End Time <span className="text-red-500">*</span>
              </label>
              <div className="p-2 md:p-3 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => {
                    setFormData({ ...formData, endTime: e.target.value });
                    validateField("endTime", e.target.value);
                  }}
                  onBlur={(e) => validateField("endTime", e.target.value)}
                  className={`w-full bg-transparent text-xs md:text-sm text-slate-900 focus:outline-none ${
                    errors.endTime ? "border-red-300" : ""
                  }`}
                  required
                  min={
                    formData.startTime
                      ? new Date(
                          new Date(formData.startTime).getTime() +
                            60 * 60 * 1000,
                        )
                          .toISOString()
                          .slice(0, 16)
                      : new Date().toISOString().slice(0, 16)
                  }
                />
              </div>
              {errors.endTime && (
                <p className="mt-1 text-xs md:text-sm text-red-600">
                  {errors.endTime}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Options */}
        <div>
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-sm md:text-base">
              <List className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
              Poll Options
              <span className="text-red-500">*</span>
            </h4>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddOption}
              className="text-xs md:text-sm"
            >
              <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 inline mr-1" />
              Add
            </Button>
          </div>

          {errors.options && (
            <p className="text-xs md:text-sm text-red-600 mb-3">
              {errors.options}
            </p>
          )}

          <div className="space-y-2 md:space-y-3">
            {formData.options.map((option, index) => (
              <div
                key={option.id}
                className="p-2 md:p-3 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div className="flex items-start gap-2 md:gap-3">
                  <span className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 bg-white rounded-full flex items-center justify-center font-semibold text-slate-700 border border-slate-300 text-xs md:text-sm">
                    {index + 1}
                  </span>
                  <div className="flex-1 space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Option name"
                        value={option.name}
                        onChange={(e) =>
                          handleOptionChange(option.id, "name", e.target.value)
                        }
                        className="w-full bg-white p-1.5 md:p-2 pr-6 rounded border border-slate-200 text-xs md:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <span className="absolute top-2 right-2 text-red-500 text-xs md:text-sm">
                        *
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="Optional description"
                      value={option.description}
                      onChange={(e) =>
                        handleOptionChange(
                          option.id,
                          "description",
                          e.target.value,
                        )
                      }
                      className="w-full bg-white p-1.5 md:p-2 rounded border border-slate-200 text-xs md:text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {formData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(option.id)}
                      className="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    );
  },
);

PollCreationForm.displayName = "PollCreationForm";

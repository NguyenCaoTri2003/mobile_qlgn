// src/screens/OrderFormScreen.tsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Dropdown } from "react-native-element-dropdown";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import debounce from "lodash.debounce";

import { orderService } from "../services/order.service";
import { departmentService } from "../services/department.service";
import { customerService } from "../services/customer.service";
import { usersService } from "../services/user.service";
import { useAuth } from "../contexts/AuthContext";
import AppNotification from "../components/AppNotification";
import {
  Department,
  Sender,
  Company,
  Contact,
  PhoneSearchResult,
  ContactSearchResult,
  Attachment,
  VisaLevel,
  OrderFormData,
  FormErrors,
  NotificationState,
  UploadedFile,
  ExistingFile,
  OrderData,
} from "../utils/order-form.types";

interface DropdownItem {
  label: string;
  value: number;
}

const PAGE_SIZE = 10;

export default function OrderFormScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const isEditMode: boolean = route.params?.orderData != null;
  const orderData: OrderData | undefined = route.params?.orderData;
  const isSuperAdmin = user?.role === "SUPERADMIN";
  const isNVAdmin = user?.role === "NVADMIN";

  // --- TIME LOGIC ---
  const getDefaultDateTime = () => {
    const now = new Date();
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();
    const nowDate = now.getDate();

    const cutoff = new Date(nowYear, nowMonth, nowDate, 11, 30, 0, 0);
    const isAfterCutoff = now >= cutoff;

    if (isAfterCutoff) {
      const tomorrow = new Date(nowYear, nowMonth, nowDate + 1);
      const date = `${String(tomorrow.getDate()).padStart(2, "0")}/${String(tomorrow.getMonth() + 1).padStart(2, "0")}/${tomorrow.getFullYear()}`;
      return {
        date: date,
        time: "08:00",
        isAfterCutoff: true,
      };
    }

    now.setMinutes(now.getMinutes() + 10);
    const date = `${String(nowDate).padStart(2, "0")}/${String(nowMonth + 1).padStart(2, "0")}/${nowYear}`;
    return {
      date: date,
      time: now.toTimeString().slice(0, 5),
      isAfterCutoff: false,
    };
  };

  const defaultDT = getDefaultDateTime();
  const [isAfterCutoff, setIsAfterCutoff] = useState(defaultDT.isAfterCutoff);
  const [today, setToday] = useState(defaultDT.date);
  const [minTime, setMinTime] = useState(defaultDT.time);

  // --- FORM STATE ---
  const [form, setForm] = useState<OrderFormData>({
    department: null,
    senderName: "",
    senderId: null,
    senderPhone: "",
    senderEmail: "",
    orderType: "DELIVERY",
    company: "",
    companyId: null,
    taxCode: "",
    phone: "",
    contact: "",
    contactId: null,
    addressLine: "",
    time: defaultDT.time,
    timeSlot: null,
    date: defaultDT.date,
    priority: "NORMAL",
    purpose: "",
    notes: "",
    amountVND: "",
    amountUSD: "",
    paymentType: null,
    visaType1: null,
    visaType2: null,
  });

  // --- TOUCHED STATES (để kiểm soát hiển thị lỗi) ---
  const [touched, setTouched] = useState({
    department: false,
    senderName: false,
    company: false,
    addressLine: false,
    purpose: false,
    time: false,
    date: false,
  });

  // --- DATA STATES ---
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allSenders, setAllSenders] = useState<Sender[]>([]);
  const [filteredSenders, setFilteredSenders] = useState<Sender[]>([]);
  const [showSenderDropdown, setShowSenderDropdown] = useState(false);
  const [senderKeyword, setSenderKeyword] = useState("");

  const [companies, setCompanies] = useState<Company[]>([]);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyPage, setCompanyPage] = useState(1);
  const [companyHasMore, setCompanyHasMore] = useState(true);
  const [companyKeyword, setCompanyKeywordState] = useState("");

  const [phoneResults, setPhoneResults] = useState<PhoneSearchResult[]>([]);
  const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);
  const [phonePage, setPhonePage] = useState(1);
  const [phoneHasMore, setPhoneHasMore] = useState(true);
  const [phoneLoading, setPhoneLoading] = useState(false);

  const [contactResults, setContactResults] = useState<ContactSearchResult[]>(
    [],
  );
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [contactPage, setContactPage] = useState(1);
  const [contactHasMore, setContactHasMore] = useState(true);
  const [contactLoading, setContactLoading] = useState(false);

  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);

  // --- ATTACHMENT STATES ---
  const [customAttachments, setCustomAttachments] = useState<Attachment[]>([]);
  const [availableAttachments, setAvailableAttachments] = useState<
    Attachment[]
  >([]);
  const [showAvailableModal, setShowAvailableModal] = useState(false);
  const [searchAvailable, setSearchAvailable] = useState("");
  const [showBulkDetailModal, setShowBulkDetailModal] = useState(false);
  const [bulkDetail, setBulkDetail] = useState("");

  // --- FILE STATES ---
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>([]);
  const [filesToDelete, setFilesToDelete] = useState<number[]>([]);

  // --- UI STATES ---
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isVisaVN, setIsVisaVN] = useState(false);
  const [visaLevel1, setVisaLevel1] = useState<VisaLevel[]>([]);
  const [visaLevel2, setVisaLevel2] = useState<VisaLevel[]>([]);
  const [loadingVisaLevel2, setLoadingVisaLevel2] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [notify, setNotify] = useState<NotificationState>({
    visible: false,
    type: "success",
    message: "",
  });
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitializingVisa, setIsInitializingVisa] = useState(false);
  const [hasInitDept, setHasInitDept] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isContactFromSelection, setIsContactFromSelection] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  const companySearchRef = useRef("");
  const phoneSearchRef = useRef("");
  const contactSearchRef = useRef("");
  const isEditModeRef = useRef(isEditMode);

  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [tempTime, setTempTime] = useState<Date>(new Date());

  const [phoneList, setPhoneList] = useState<string[]>([]);
  const [selectedPhoneIndex, setSelectedPhoneIndex] = useState<number>(0);
  const [showPhoneSelect, setShowPhoneSelect] = useState(false);

  // Thêm helper function để format date
  const formatDateToDisplay = (dateStr: string): string => {
    if (!dateStr) return "";
    // Nếu là format YYYY-MM-DD
    if (dateStr.includes("-") && dateStr.split("-")[0].length === 4) {
      const [year, month, day] = dateStr.split("-");
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  const formatDateToAPI = (dateStr: string): string => {
    if (!dateStr) return "";
    // Nếu là format DD/MM/YYYY
    if (dateStr.includes("/")) {
      const [day, month, year] = dateStr.split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return dateStr;
  };

  // Helper để tạo date string cho API
  const getDateForAPI = (dateStr: string): string => {
    if (!dateStr) return "";
    // Nếu đã là format YYYY-MM-DD thì giữ nguyên
    if (dateStr.includes("-") && dateStr.split("-")[0].length === 4) {
      return dateStr;
    }
    return formatDateToAPI(dateStr);
  };

  // ==================== VALIDATION ====================
  const validateField = useCallback(
    (field: keyof OrderFormData, value: any): string => {
      switch (field) {
        case "department":
          return !value ? "Vui lòng chọn bộ phận" : "";
        case "senderId":
          return !value ? "Vui lòng chọn người yêu cầu" : "";
        case "companyId":
          return !value ? "Vui lòng chọn công ty từ danh sách" : "";
        case "addressLine":
          return !value ? "Vui lòng nhập địa chỉ" : "";
        case "purpose":
          return !value ? "Vui lòng nhập thông tin yêu cầu" : "";
        case "time":
          return !value ? "Vui lòng chọn giờ" : "";
        case "date":
          return !value ? "Vui lòng chọn ngày" : "";
        default:
          return "";
      }
    },
    [],
  );

  const handleTimeConfirm = () => {
    // Xử lý nếu cần lưu tempTime
    setShowTimePicker(false);
  };

  const handleTimeChangeIOS = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (selectedDate) {
      setTempTime(selectedDate);
      const hours = selectedDate.getHours().toString().padStart(2, "0");
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
      const newTime = `${hours}:${minutes}`;
      setForm((prev: any) => ({ ...prev, time: newTime }));
      setTouched((prev) => ({ ...prev, time: true }));
    }
  };

  const handleDateConfirm = () => {
    const year = tempDate.getFullYear();
    const month = String(tempDate.getMonth() + 1).padStart(2, "0");
    const day = String(tempDate.getDate()).padStart(2, "0");
    const newDate = `${day}/${month}/${year}`;

    setForm((prev: any) => ({ ...prev, date: newDate }));
    setTouched((prev) => ({ ...prev, date: true }));

    const now = new Date();
    const todayStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

    if (newDate === todayStr) {
      now.setMinutes(now.getMinutes() + 10);
      setMinTime(now.toTimeString().slice(0, 5));
    } else {
      setMinTime("");
    }
    setShowDatePicker(false);
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
  };

  // Sửa lại validateForm - kiểm tra tất cả required fields
  const validateForm = useCallback(() => {
    // Nếu đang initializing, bỏ qua validation
    if (isInitializing) {
      setIsFormValid(true);
      return true;
    }

    const newErrors: FormErrors = {};

    // KIỂM TRA TẤT CẢ REQUIRED FIELDS (không cần touched)
    if (!form.department) newErrors.department = "Vui lòng chọn bộ phận";
    if (!form.senderId) newErrors.senderName = "Vui lòng chọn người yêu cầu";
    if (!form.company) newErrors.company = "Vui lòng chọn công ty từ danh sách";
    if (!form.companyId) {
      // Nếu có text nhưng chưa chọn từ dropdown
      if (form.company)
        newErrors.company = "Vui lòng chọn công ty từ danh sách";
      else if (!form.company)
        newErrors.company = "Vui lòng chọn công ty từ danh sách";
    }
    if (!form.addressLine) newErrors.addressLine = "Vui lòng nhập địa chỉ";
    if (!form.purpose) newErrors.purpose = "Vui lòng nhập thông tin yêu cầu";
    if (!form.timeSlot && !form.time) newErrors.time = "Vui lòng chọn giờ";
    if (!form.date) newErrors.date = "Vui lòng chọn ngày";

    setErrors(newErrors);
    const isValid = Object.values(newErrors).every((e) => !e);
    setIsFormValid(isValid);
    return isValid;
  }, [form, isInitializing]);

  // Validate khi form thay đổi (không hiển thị lỗi mới vào)
  useEffect(() => {
    validateForm();
  }, [validateForm]);

  // Helper để hiển thị lỗi chỉ khi field đã được touched
  const showError = (field: keyof typeof touched): boolean => {
    return touched[field] && !!errors[field as keyof FormErrors];
  };

  // ==================== INITIALIZATION ====================
  useEffect(() => {
    loadDepartments();
    if (isEditMode && orderData) {
      setIsInitializing(true);
      populateEditData();
    }
  }, []);

  useEffect(() => {
    if (departments.length > 0 && !hasInitDept) {
      initDepartment();
    }
  }, [departments]);

  // Load senders & attachments when department changes
  useEffect(() => {
    if (form.department) {
      loadSenders(form.department);
      handleDepartmentChange(form.department);
    }
  }, [form.department]);

  // Load visa level 2 when visaType1 changes
  useEffect(() => {
    if (form.visaType1 && isVisaVN && !isInitializingVisa) {
      loadVisaLevel2(form.visaType1);
      if (!isInitializing) {
        setForm((prev: any) => ({ ...prev, visaType2: null }));
        setCustomAttachments([]);
        setAvailableAttachments([]);
      }
    }
  }, [form.visaType1]);

  // Load attachments when visaType2 changes
  useEffect(() => {
    if (form.visaType2 && isVisaVN && !isInitializingVisa) {
      loadVisaAttachments();
    }
  }, [form.visaType2]);

  useEffect(() => {
    updateTimeConstraints();
  }, [form.priority]);

  const updateTimeConstraints = () => {
    const now = new Date();
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();
    const nowDate = now.getDate();
    const todayStr = `${String(nowDate).padStart(2, "0")}/${String(nowMonth + 1).padStart(2, "0")}/${nowYear}`;

    const cutoff = new Date(nowYear, nowMonth, nowDate, 11, 30, 0, 0);

    if (form.priority === "HIGH") {
      setToday(todayStr);
      now.setMinutes(now.getMinutes() + 10);
      setMinTime(now.toTimeString().slice(0, 5));
      return;
    }

    if (now >= cutoff) {
      const tomorrow = new Date(nowYear, nowMonth, nowDate + 1);
      const tomorrowStr = `${String(tomorrow.getDate()).padStart(2, "0")}/${String(tomorrow.getMonth() + 1).padStart(2, "0")}/${tomorrow.getFullYear()}`;
      setToday(tomorrowStr);
      setMinTime("08:00");
      setIsAfterCutoff(true);
    } else {
      setToday(todayStr);
      if (form.date === todayStr) {
        now.setMinutes(now.getMinutes() + 10);
        setMinTime(now.toTimeString().slice(0, 5));
      } else {
        setMinTime("");
      }
      setIsAfterCutoff(false);
    }
  };

  // ==================== DEPARTMENT INIT ====================
  const initDepartment = () => {
    if (isEditMode && orderData?.department?.id) {
      const deptId = orderData.department.id;
      setForm((prev) => ({ ...prev, department: deptId }));
      setHasInitDept(true);
      // Đánh dấu đã touched cho department khi edit
      setTouched((prev) => ({ ...prev, department: true }));
      return;
    }
    let deptId: number | null = null;
    if (!isSuperAdmin && isNVAdmin && user?.departmentId) {
      const dept = departments.find(
        (d: any) => d.external_id === user.departmentId,
      );
      if (dept) deptId = dept.id;
    } else {
      const defaultDept = departments.find(
        (d: any) => Number(d.is_default) === 1,
      );
      if (defaultDept) deptId = defaultDept.id;
    }
    if (deptId) {
      setForm((prev) => ({ ...prev, department: deptId }));
    }
    setHasInitDept(true);
  };

  // ==================== DEPARTMENT CHANGE HANDLER ====================
  const handleDepartmentChange = (deptId: number) => {
    const dept = departments.find((d) => d.id === deptId);
    if (!dept) return;

    setIsVisaVN(false);
    setVisaLevel1([]);
    setVisaLevel2([]);
    setForm((prev: any) => ({ ...prev, visaType1: null, visaType2: null }));

    if (dept.code === "VSVN") {
      loadVisaLevel1(dept.external_id);
    } else {
      loadDepartmentAttachments(dept.external_id);
    }
  };

  // ==================== VISA LOGIC ====================
  const loadVisaLevel1 = async (externalDeptId: number) => {
    try {
      const res =
        await departmentService.getAttachmentsByDepartment(externalDeptId);
      const visaTypes = (res || []).map((item: any) => ({
        id: item.id,
        name: item.name,
      }));
      setVisaLevel1(visaTypes);
      setIsVisaVN(true);

      if (isEditMode && orderData?.attachments?.length) {
        handleEditVisaData(externalDeptId, orderData);
      }
    } catch (err) {
      console.log("Load visa level 1 error:", err);
    }
  };

  const loadVisaLevel2 = async (typeId: number) => {
    const dept = departments.find((d) => d.id === form.department);
    if (!dept) return;

    setLoadingVisaLevel2(true);
    try {
      const res = await departmentService.getVisaVNTypeByDepartment(
        dept.external_id,
        typeId,
      );
      setVisaLevel2(res || []);
    } catch (err) {
      console.log("Load visa level 2 error:", err);
    } finally {
      setLoadingVisaLevel2(false);
    }
  };

  // const loadVisaAttachments = async () => {
  //   const dept = departments.find((d) => d.id === form.department);
  //   if (!dept || !form.visaType1 || !form.visaType2) return;

  //   try {
  //     const res = await departmentService.getVisaVNTypeDetailsByDepartment(
  //       dept.external_id,
  //       form.visaType1,
  //       form.visaType2,
  //     );
  //     const mapped: Attachment[] = (res || []).map((item: any) => ({
  //       name: item.name,
  //       qty: 1,
  //       is_original: item.is_original || false,
  //       is_original_hph: item.is_original_hph || false,
  //       is_copy: item.is_copy || false,
  //       detail: item.detail || "",
  //       note: item.note || "",
  //       checked: false,
  //       selected: false,
  //       showDetail: false,
  //       showNote: false,
  //       external_profile_id: item.id ?? null,
  //     }));

  //     if (isEditMode && orderData?.attachments) {
  //       const existingNames = new Set(
  //         orderData.attachments.map((a: any) => a.name),
  //       );
  //       setCustomAttachments(orderData.attachments.map((a: any) => ({ ...a })));
  //       setAvailableAttachments(
  //         mapped.filter((m) => !existingNames.has(m.name)),
  //       );
  //     } else {
  //       if (mapped.length <= 5) {
  //         setCustomAttachments(mapped);
  //         setAvailableAttachments([]);
  //       } else {
  //         setCustomAttachments(mapped.slice(0, 5));
  //         setAvailableAttachments(mapped.slice(5));
  //       }
  //     }
  //   } catch (err) {
  //     console.log("Load visa attachments error:", err);
  //   }
  // };

  const loadVisaAttachments = async () => {
    const dept = departments.find((d) => d.id === form.department);
    if (!dept || !form.visaType1 || !form.visaType2) return;

    try {
      const res = await departmentService.getVisaVNTypeDetailsByDepartment(
        dept.external_id,
        form.visaType1,
        form.visaType2,
      );
      const mapped: Attachment[] = (res || []).map((item: any) => ({
        name: item.name,
        qty: 1,
        is_original: item.is_original || false,
        is_original_hph: item.is_original_hph || false,
        is_copy: item.is_copy || false,
        detail: item.detail || "",
        note: item.note || "",
        checked: false,
        selected: false,
        showDetail: false,
        showNote: false,
        external_profile_id: item.id ?? null,
      }));

      if (isEditMode && orderData?.attachments) {
        const existingNames = new Set(
          orderData.attachments.map((a: any) => a.name),
        );
        setCustomAttachments(orderData.attachments.map((a: any) => ({ ...a })));
        setAvailableAttachments(
          mapped.filter((m) => !existingNames.has(m.name)),
        );
      } else {
        // 👉 SỬA: Không hiển thị mặc định, tất cả vào available
        setCustomAttachments([]);
        setAvailableAttachments(mapped);
      }
    } catch (err) {
      console.log("Load visa attachments error:", err);
    }
  };

  const handleEditVisaData = (externalDeptId: number, data: OrderData) => {
    if (!data.attachments?.length) return;

    setIsInitializingVisa(true);
    const firstAtt = data.attachments[0] as any;

    if (firstAtt.external_visa_type_id) {
      setForm((prev: any) => ({
        ...prev,
        visaType1: firstAtt.external_visa_type_id,
      }));

      departmentService
        .getVisaVNTypeByDepartment(
          externalDeptId,
          firstAtt.external_visa_type_id,
        )
        .then((res2) => {
          setVisaLevel2(res2 || []);

          if (firstAtt.external_visa_detail_id) {
            setForm((prev: any) => ({
              ...prev,
              visaType2: firstAtt.external_visa_detail_id,
            }));

            departmentService
              .getVisaVNTypeDetailsByDepartment(
                externalDeptId,
                firstAtt.external_visa_type_id,
                firstAtt.external_visa_detail_id,
              )
              .then((res3) => {
                const mapped: Attachment[] = (res3 || []).map((item: any) => ({
                  name: item.name,
                  qty: 1,
                  is_original: item.is_original || false,
                  is_original_hph: item.is_original_hph || false,
                  is_copy: item.is_copy || false,
                  detail: item.detail || "",
                  note: item.note || "",
                  checked: false,
                  selected: false,
                  showDetail: false,
                  showNote: false,
                  external_profile_id: item.id ?? null,
                }));

                setCustomAttachments(
                  data.attachments!.map((a: any) => ({ ...a })),
                );
                const existing = new Set(
                  data.attachments!.map((a: any) => a.name),
                );
                setAvailableAttachments(
                  mapped.filter((m) => !existing.has(m.name)),
                );
                setIsInitializingVisa(false);
              });
          } else {
            setIsInitializingVisa(false);
          }
        });
    } else {
      setIsInitializingVisa(false);
    }
  };

  // ==================== LOAD DATA ====================
  const loadDepartments = async (): Promise<void> => {
    try {
      const data: Department[] = await departmentService.loadDepartments();
      setDepartments(data);
    } catch (err) {
      console.log("Load departments error:", err);
    }
  };

  const populateEditData = (): void => {
    if (!orderData) return;

    setIsInitializing(true); // 👈 BẮT ĐẦU INIT

    const convertDateToDisplay = (dateStr: string): string => {
      if (!dateStr) return defaultDT.date;
      if (dateStr.includes("/")) return dateStr;
      const [year, month, day] = dateStr.split("-");
      return `${day}/${month}/${year}`;
    };

    setForm({
      department: orderData.department?.id ?? null,
      senderName: orderData.senderName ?? "",
      senderId: orderData.externalSenderId ?? null,
      senderPhone: orderData.senderPhone ?? "",
      senderEmail: orderData.senderEmail ?? "",
      orderType: orderData.orderType ?? "DELIVERY",
      company: orderData.company ?? "",
      companyId: orderData.companyId ?? null,
      taxCode: orderData.taxCode ?? "",
      phone: orderData.phone ?? "",
      contact: orderData.contact ?? "",
      contactId: orderData.contactId ?? null,
      addressLine: orderData.address ?? "",
      time: orderData.time ?? defaultDT.time,
      timeSlot: orderData.timeSlot || null,
      date: convertDateToDisplay(orderData.date ?? defaultDT.date),
      priority: orderData.priority ?? "NORMAL",
      purpose: orderData.purpose ?? "",
      notes: orderData.notes ?? "",
      amountVND: orderData.amountVND?.toString() ?? "",
      amountUSD: orderData.amountUSD?.toString() ?? "",
      paymentType: orderData.paymentType ?? null,
      visaType1: (orderData as any).visaType1 ?? null,
      visaType2: (orderData as any).visaType2 ?? null,
    });

    // KHÔNG set touched.company = true khi edit
    setTouched({
      department: true,
      senderName: true,
      company: false, // 👈 QUAN TRỌNG: không touched lúc đầu
      addressLine: true,
      purpose: true,
      time: true,
      date: true,
    });

    if (orderData.attachments) {
      setCustomAttachments(orderData.attachments.map((a: any) => ({ ...a })));
    }
    if (orderData.uploadedFiles) {
      setExistingFiles([...orderData.uploadedFiles]);
    }
    if (orderData.company) {
      loadCompanyForEdit(orderData);
    }

    // KẾT THÚC INIT SAU 500ms
    setTimeout(() => {
      setIsInitializing(false);
    }, 500);
  };
  const loadCompanyForEdit = async (data: OrderData) => {
    try {
      const res = await customerService.searchCompanies(data.company || "", 1);
      const found = res.data?.find((c: any) => c.company_name === data.company);
      if (found) {
        setSelectedCompany(found);
        const contacts: Contact[] = (found.contacts || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
        }));
        const selected = contacts.find((c) => c.id == data.contactId);
        if (!selected && data.contact) {
          contacts.push({
            id: data.contactId || 0,
            name: data.contact,
            phone: data.phone,
          });
        }
        setAvailableContacts(contacts);
        setIsContactFromSelection(true);
      }
    } catch (err) {
      console.log("Load company for edit error:", err);
    }
  };

  const loadSenders = async (deptId: number): Promise<void> => {
    const dept = departments.find((d) => d.id === deptId);
    if (!dept) return;
    try {
      const res: Sender[] = await usersService.getAdmins(dept.external_id);
      setAllSenders(res);
      setFilteredSenders(res);
      if (!isSuperAdmin && !isEditMode) {
        const currentUser = res.find((u) => u.id === user?.id);
        if (currentUser) {
          setForm((prev: any) => ({
            ...prev,
            senderName: currentUser.name,
            senderId: currentUser.id,
            senderPhone: currentUser.phone ?? "",
            senderEmail: currentUser.email ?? "",
          }));
        }
      }
    } catch (err) {
      console.log("Load senders error:", err);
    }
  };

  // const loadDepartmentAttachments = async (externalDeptId: number) => {
  //   try {
  //     const res =
  //       await departmentService.getAttachmentsByDepartment(externalDeptId);
  //     const mapped: Attachment[] = (res || []).map((item: any) => ({
  //       name: item.name,
  //       qty: 1,
  //       is_original: item.is_original || false,
  //       is_original_hph: item.is_original_hph || false,
  //       is_copy: item.is_copy || false,
  //       detail: item.detail || "",
  //       note: item.note || "",
  //       checked: false,
  //       selected: false,
  //       showDetail: false,
  //       showNote: false,
  //       external_profile_id: item.id ?? null,
  //     }));

  //     if (isEditMode && orderData?.attachments) {
  //       const existingNames = new Set(
  //         orderData.attachments.map((a: any) => a.name),
  //       );
  //       setCustomAttachments(orderData.attachments.map((a: any) => ({ ...a })));
  //       setAvailableAttachments(
  //         mapped.filter((m) => !existingNames.has(m.name)),
  //       );
  //     } else {
  //       if (mapped.length <= 5) {
  //         setCustomAttachments(mapped);
  //         setAvailableAttachments([]);
  //       } else {
  //         setCustomAttachments(mapped.slice(0, 5));
  //         setAvailableAttachments(mapped.slice(5));
  //       }
  //     }
  //   } catch (err) {
  //     console.log("Load attachments error:", err);
  //   }
  // };

  // ==================== COMPANY SEARCH ====================

  const loadDepartmentAttachments = async (externalDeptId: number) => {
    try {
      const res =
        await departmentService.getAttachmentsByDepartment(externalDeptId);
      const mapped: Attachment[] = (res || []).map((item: any) => ({
        name: item.name,
        qty: 1,
        is_original: item.is_original || false,
        is_original_hph: item.is_original_hph || false,
        is_copy: item.is_copy || false,
        detail: item.detail || "",
        note: item.note || "",
        checked: false,
        selected: false,
        showDetail: false,
        showNote: false,
        external_profile_id: item.id ?? null,
      }));

      if (isEditMode && orderData?.attachments) {
        const existingNames = new Set(
          orderData.attachments.map((a: any) => a.name),
        );
        setCustomAttachments(orderData.attachments.map((a: any) => ({ ...a })));
        setAvailableAttachments(
          mapped.filter((m) => !existingNames.has(m.name)),
        );
      } else {
        // 👉 SỬA: Không hiển thị mặc định, tất cả vào available
        setCustomAttachments([]);
        setAvailableAttachments(mapped);
      }
    } catch (err) {
      console.log("Load attachments error:", err);
    }
  };

  const performCompanySearch = async (
    keyword: string,
    page: number = 1,
    append: boolean = false,
  ): Promise<void> => {
    if (!keyword) {
      setCompanies([]);
      setCompanyHasMore(true);
      setCompanyPage(1);
      return;
    }
    setCompanyLoading(true);
    try {
      const res = await customerService.searchCompanies(keyword, page);
      const newData = res.data || [];
      if (append) {
        setCompanies((prev) => [...prev, ...newData]);
      } else {
        setCompanies(newData);
      }
      setCompanyHasMore(newData.length >= PAGE_SIZE);
      setCompanyPage(page);
    } catch (err) {
      console.log("Search companies error:", err);
    } finally {
      setCompanyLoading(false);
    }
  };

  const debouncedSearchCompanies = useCallback(
    debounce((keyword: string) => {
      setCompanyPage(1);
      setCompanyHasMore(true);
      performCompanySearch(keyword, 1, false);
    }, 300),
    [],
  );

  const searchCompanies = (keyword: string): void => {
    companySearchRef.current = keyword;
    setCompanyKeywordState(keyword);
    setSelectedCompany(null);
    setForm((prev: any) => ({ ...prev, companyId: null }));
    debouncedSearchCompanies(keyword);
  };

  const loadMoreCompanies = () => {
    if (!companyLoading && companyHasMore) {
      performCompanySearch(companyKeyword, companyPage + 1, true);
    }
  };

  // ==================== PHONE SEARCH ====================
  // const performPhoneSearch = async (
  //   phone: string,
  //   page: number = 1,
  //   append: boolean = false,
  // ): Promise<void> => {
  //   const cleaned = phone.replace(/\D/g, "");
  //   if (cleaned.length < 5) {
  //     setPhoneResults([]);
  //     setPhoneHasMore(true);
  //     setPhonePage(1);
  //     return;
  //   }
  //   setPhoneLoading(true);
  //   try {
  //     const res = await customerService.searchCompaniesByPhone(cleaned, page);
  //     const newData = (res.data || []).map((item: any) => ({
  //       id: item.id,
  //       company_name: item.company_name,
  //       phone: item.phone ?? cleaned,
  //       contactName: item.contactName || item.contact_name || "",
  //     }));
  //     if (append) {
  //       setPhoneResults((prev) => [...prev, ...newData]);
  //     } else {
  //       setPhoneResults(newData);
  //     }
  //     setPhoneHasMore(newData.length >= PAGE_SIZE);
  //     setPhonePage(page);
  //   } catch (err) {
  //     console.log("Search phone error:", err);
  //   } finally {
  //     setPhoneLoading(false);
  //   }
  // };

  const performPhoneSearch = async (
    phone: string,
    page: number = 1,
    append: boolean = false,
  ): Promise<void> => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 5) {
      setPhoneResults([]);
      setPhoneHasMore(true);
      setPhonePage(1);
      return;
    }
    setPhoneLoading(true);
    try {
      const res = await customerService.searchCompaniesByPhone(cleaned, page);
      // 👉 Lưu toàn bộ data từ API, không map lại
      const newData = (res.data || []).map((item: any) => ({
        ...item, // 👈 GIỮ NGUYÊN TẤT CẢ THÔNG TIN
        id: item.id,
        company_name: item.company_name,
        phone: item.phone ?? cleaned,
        contactName: item.contactName || item.contact_name || "",
      }));
      if (append) {
        setPhoneResults((prev) => [...prev, ...newData]);
      } else {
        setPhoneResults(newData);
      }
      setPhoneHasMore(newData.length >= PAGE_SIZE);
      setPhonePage(page);
    } catch (err) {
      console.log("Search phone error:", err);
    } finally {
      setPhoneLoading(false);
    }
  };

  const debouncedSearchByPhone = useCallback(
    debounce((phone: string) => {
      setPhonePage(1);
      setPhoneHasMore(true);
      performPhoneSearch(phone, 1, false);
    }, 400),
    [],
  );

  const searchByPhone = (phone: string): void => {
    phoneSearchRef.current = phone;
    setSelectedCompany(null);
    setForm((prev: any) => ({
      ...prev,
      companyId: null,
      contactId: null,
      contact: "",
    }));
    debouncedSearchByPhone(phone);
  };

  const loadMorePhones = () => {
    if (!phoneLoading && phoneHasMore) {
      performPhoneSearch(phoneSearchRef.current, phonePage + 1, true);
    }
  };

  // ==================== CONTACT SEARCH ====================
  // const performContactSearch = async (
  //   keyword: string,
  //   page: number = 1,
  //   append: boolean = false,
  // ): Promise<void> => {
  //   if (!keyword) {
  //     setContactResults([]);
  //     setContactHasMore(true);
  //     setContactPage(1);
  //     return;
  //   }
  //   setContactLoading(true);
  //   try {
  //     const res = await customerService.searchCompaniesByContactName(
  //       keyword,
  //       page,
  //     );
  //     const newData = (res.data || []).map((company: any) => ({
  //       id: company.id,
  //       company_name: company.company_name,
  //       phone: company.phone || "",
  //       contactName: company.contactName || company.contact_name || "",
  //     }));
  //     if (append) {
  //       setContactResults((prev) => [...prev, ...newData]);
  //     } else {
  //       setContactResults(newData);
  //     }
  //     setContactHasMore(newData.length >= PAGE_SIZE);
  //     setContactPage(page);
  //   } catch (err) {
  //     console.log("Search contact error:", err);
  //   } finally {
  //     setContactLoading(false);
  //   }
  // };

  const performContactSearch = async (
    keyword: string,
    page: number = 1,
    append: boolean = false,
  ): Promise<void> => {
    if (!keyword) {
      setContactResults([]);
      setContactHasMore(true);
      setContactPage(1);
      return;
    }
    setContactLoading(true);
    try {
      const res = await customerService.searchCompaniesByContactName(
        keyword,
        page,
      );
      // 👉 Lưu toàn bộ data từ API
      const newData = (res.data || []).map((company: any) => ({
        ...company, // 👈 GIỮ NGUYÊN TẤT CẢ THÔNG TIN
        id: company.id,
        company_name: company.company_name,
        phone: company.phone || "",
        contactName: company.contactName || company.contact_name || "",
      }));
      if (append) {
        setContactResults((prev) => [...prev, ...newData]);
      } else {
        setContactResults(newData);
      }
      setContactHasMore(newData.length >= PAGE_SIZE);
      setContactPage(page);
    } catch (err) {
      console.log("Search contact error:", err);
    } finally {
      setContactLoading(false);
    }
  };

  const debouncedSearchByContact = useCallback(
    debounce((keyword: string) => {
      setContactPage(1);
      setContactHasMore(true);
      performContactSearch(keyword, 1, false);
    }, 300),
    [],
  );

  const searchByContact = (keyword: string): void => {
    contactSearchRef.current = keyword;
    setSelectedCompany(null);
    setForm((prev: any) => ({ ...prev, companyId: null, contactId: null }));
    setIsContactFromSelection(false);
    debouncedSearchByContact(keyword);
  };

  const loadMoreContacts = () => {
    if (!contactLoading && contactHasMore) {
      performContactSearch(contactSearchRef.current, contactPage + 1, true);
    }
  };

  // Hàm tách số điện thoại từ chuỗi có dấu chấm phẩy
  const parsePhones = (phoneStr: string): string[] => {
    if (!phoneStr) return [];

    // Tách theo dấu chấm phẩy, dấu phẩy hoặc dấu gạch chéo
    const phones = phoneStr
      .split(/[;,\/]/)
      .map((p) => p.replace(/\s+/g, "")) // Xóa tất cả khoảng trắng
      .map((p) => p.replace(/\D/g, "")) // Chỉ giữ lại số
      .filter((p) => p.length > 0);

    return phones;
  };

  const handlePhoneSelect = (phone: string, index: number) => {
    setSelectedPhoneIndex(index);
    setForm((prev: any) => ({ ...prev, phone: phone }));
    setShowPhoneSelect(false);
  };

  const applyCompanyData = (company: any): void => {
    setSelectedCompany(company);

    // Parse phone numbers
    const phones = parsePhones(company.phone || "");

    let contacts: Contact[] = [];

    if (company.contacts && company.contacts.length > 0) {
      contacts = company.contacts.map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
      }));
    } else if (company.contactName || company.contact_name) {
      contacts = [
        {
          id: company.contactId || company.id,
          name: company.contactName || company.contact_name,
          phone: phones[0] || company.phone || "",
        },
      ];
    }

    setAvailableContacts(contacts);
    setIsContactFromSelection(true);
    const primaryContact = contacts[0] || ({} as Contact);

    // Set phone list
    setPhoneList(phones);
    setSelectedPhoneIndex(0);
    setShowPhoneSelect(phones.length > 1);

    setForm((prev: any) => ({
      ...prev,
      company: company.company_name ?? "",
      companyId: company.id,
      taxCode: company.tax_code ?? "",
      phone: phones[0] || "", // Số đầu tiên không có khoảng trắng
      contact: primaryContact.name ?? company.contactName ?? "",
      contactId: primaryContact.id ?? company.contactId ?? null,
      addressLine: company.address || prev.addressLine,
    }));

    setTouched((prev) => ({ ...prev, company: true }));
    setErrors((prev) => ({ ...prev, company: undefined }));
    setShowCompanyDropdown(false);
    setShowPhoneDropdown(false);
    setShowContactDropdown(false);
  };

  // ==================== FILE HANDLING ====================
  const pickDocument = async (): Promise<void> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "image/*",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets) {
        const validFiles: UploadedFile[] = result.assets.filter(
          (asset: any) => (asset.size || 0) / (1024 * 1024) <= 5,
        );
        if (validFiles.length < result.assets.length) {
          setNotify({
            visible: true,
            type: "error",
            message: "Một số file bị bỏ qua do vượt quá 5MB",
          });
        }
        setUploadedFiles((prev) => [...prev, ...validFiles]);
      }
    } catch (err) {
      console.log("Pick document error:", err);
    }
  };

  const removeUploadedFile = (index: number): void => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };
  const removeExistingFile = (file: ExistingFile): void => {
    setFilesToDelete((prev) => [...prev, file.id]);
    setExistingFiles((prev) =>
      prev.map((f) => (f.id === file.id ? { ...f, _deleting: true } : f)),
    );
    setTimeout(() => {
      setExistingFiles((prev) => prev.filter((f) => f.id !== file.id));
    }, 200);
  };

  // ==================== ATTACHMENT HANDLING ====================
  const addNewAttachment = (): void => {
    setCustomAttachments((prev) => [
      ...prev,
      {
        name: "",
        qty: 1,
        is_original: false,
        is_original_hph: false,
        is_copy: false,
        detail: "",
        note: "",
        checked: false,
        selected: false,
        showDetail: false,
        showNote: false,
      },
    ]);
  };

  const updateAttachmentField = <K extends keyof Attachment>(
    index: number,
    field: K,
    value: Attachment[K],
  ): void => {
    setCustomAttachments((prev) =>
      prev.map((att, i) => (i === index ? { ...att, [field]: value } : att)),
    );
  };

  const updateAttachmentQty = (index: number, delta: number): void => {
    setCustomAttachments((prev) =>
      prev.map((att, i) =>
        i === index ? { ...att, qty: Math.max(1, att.qty + delta) } : att,
      ),
    );
  };

  const removeAttachment = (index: number): void => {
    const removed = customAttachments[index];
    setCustomAttachments((prev) => prev.filter((_, i) => i !== index));
    if (removed?.name && removed.name.trim()) {
      setAvailableAttachments((prev) => [
        ...prev,
        { ...removed, checked: false },
      ]);
    }
  };

  const filteredAvailable = () => {
    const keyword = searchAvailable.toLowerCase().trim();
    if (!keyword) return availableAttachments;
    return availableAttachments.filter((a) =>
      a.name.toLowerCase().includes(keyword),
    );
  };

  const allAvailableSelected = () => {
    const list = filteredAvailable();
    return list.length > 0 && list.every((a) => a.checked);
  };

  const toggleSelectAllAvailable = () => {
    const shouldSelect = !allAvailableSelected();
    const filtered = filteredAvailable();
    setAvailableAttachments((prev) =>
      prev.map((a) => {
        const isInFiltered = filtered.some(
          (f) =>
            f.name === a.name &&
            f.external_profile_id === a.external_profile_id,
        );
        return isInFiltered ? { ...a, checked: shouldSelect } : a;
      }),
    );
  };

  const confirmAddAvailable = () => {
    const selected = availableAttachments.filter((a) => a.checked);
    if (selected.length === 0) {
      setShowAvailableModal(false);
      return;
    }
    setCustomAttachments((prev) => [
      ...prev,
      ...selected.map((a) => ({
        ...a,
        checked: false,
        selected: false,
        showDetail: false,
        showNote: false,
      })),
    ]);
    setAvailableAttachments((prev) => prev.filter((a) => !a.checked));
    setShowAvailableModal(false);
    setSearchAvailable("");
  };

  const hasSelectedAttachments = (): boolean =>
    customAttachments.some((a) => a.selected);
  const isAllSelected = (): boolean =>
    customAttachments.length > 0 && customAttachments.every((a) => a.selected);

  const toggleSelectAllCustom = () => {
    const isAll = isAllSelected();
    setCustomAttachments((prev) =>
      prev.map((a) => ({ ...a, selected: !isAll })),
    );
  };

  const clearAllCustom = () => {
    const current = customAttachments;
    if (current.length === 0) return;
    const validAttachments = current.filter((a) => a.name && a.name.trim());
    setAvailableAttachments((prev) => [
      ...prev,
      ...validAttachments.map((a) => ({
        ...a,
        checked: false,
        selected: false,
      })),
    ]);
    setCustomAttachments([]);
  };

  const applyBulkDetail = () => {
    setCustomAttachments((prev) =>
      prev.map((att) =>
        att.selected ? { ...att, detail: bulkDetail, showDetail: true } : att,
      ),
    );
    setShowBulkDetailModal(false);
    setBulkDetail("");
  };

  const shouldShowHPH = (): boolean => {
    const dept = departments.find((d) => d.id === form.department);
    return dept?.code === "VSNN";
  };

  // ==================== SENDER ====================
  const filterSenders = (keyword: string): void => {
    setSenderKeyword(keyword);
    if (!keyword) {
      setFilteredSenders(allSenders);
    } else {
      setFilteredSenders(
        allSenders.filter((s) =>
          s.name.toLowerCase().includes(keyword.toLowerCase()),
        ),
      );
    }
  };

  const selectSender = (sender: Sender): void => {
    setForm((prev: any) => ({
      ...prev,
      senderName: sender.name,
      senderId: sender.id,
      senderPhone: sender.phone ?? "",
      senderEmail: sender.email ?? "",
    }));
    setErrors((prev: any) => ({ ...prev, senderName: undefined }));
    setTouched((prev) => ({ ...prev, senderName: true }));
    setShowSenderDropdown(false);
  };

  // ==================== DATE/TIME ====================
  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ): void => {
    setShowDatePicker(false);
    if (event.type !== "dismissed" && selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const newDate = `${day}/${month}/${year}`;

      setForm((prev: any) => ({ ...prev, date: newDate }));
      setTouched((prev) => ({ ...prev, date: true }));

      const now = new Date();
      const todayStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

      if (newDate === todayStr) {
        now.setMinutes(now.getMinutes() + 10);
        setMinTime(now.toTimeString().slice(0, 5));
      } else {
        setMinTime("");
      }
    }
  };
  const handleTimeChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ): void => {
    setShowTimePicker(false);
    if (event.type !== "dismissed" && selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, "0");
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
      const newTime = `${hours}:${minutes}`;
      setForm((prev: any) => ({ ...prev, time: newTime }));
      setTouched((prev) => ({ ...prev, time: true }));
    }
  };

  const isTimeValid = (): boolean => {
    if (!form.date || !form.time) return true;

    const now = new Date();
    const [day, month, year] = form.date.split("/").map(Number);
    const [hours, minutes] = form.time.split(":").map(Number);

    const selectedDateTime = new Date(year, month - 1, day, hours, minutes);
    const nowDateTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
    );

    return selectedDateTime >= nowDateTime;
  };

  // const togglePriority = (): void => {
  //   const newPriority = form.priority === "HIGH" ? "NORMAL" : "HIGH";
  //   const now = new Date();
  //   const todayStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

  //   if (newPriority === "HIGH") {
  //     now.setMinutes(now.getMinutes() + 10);
  //     const newTime = now.toTimeString().slice(0, 5);
  //     setForm((prev: any) => ({
  //       ...prev,
  //       priority: "HIGH",
  //       date: todayStr,
  //       time: newTime,
  //     }));
  //     setToday(todayStr);
  //     setMinTime(newTime);
  //     setIsAfterCutoff(false);
  //     setTouched((prev) => ({ ...prev, date: true, time: true }));
  //   } else {
  //     const defaultDT = getDefaultDateTime();
  //     setForm((prev: any) => ({
  //       ...prev,
  //       priority: "NORMAL",
  //       date: defaultDT.date,
  //       time: defaultDT.time,
  //     }));
  //     setToday(defaultDT.date);
  //     setMinTime(defaultDT.time);
  //     setIsAfterCutoff(defaultDT.isAfterCutoff);
  //   }
  // };

  // ==================== PAYMENT ====================

  const togglePriority = (): void => {
    const newPriority = form.priority === "HIGH" ? "NORMAL" : "HIGH";
    const now = new Date();
    const todayStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

    if (newPriority === "HIGH") {
      now.setMinutes(now.getMinutes() + 10);
      const newTime = now.toTimeString().slice(0, 5);
      setForm((prev: any) => ({
        ...prev,
        priority: "HIGH",
        date: todayStr,
        time: newTime,
        timeSlot: null, // Reset timeSlot khi chọn khẩn
      }));
      setToday(todayStr);
      setMinTime(newTime);
      setIsAfterCutoff(false);
      setTouched((prev) => ({ ...prev, date: true, time: true }));
    } else {
      const defaultDT = getDefaultDateTime();
      setForm((prev: any) => ({
        ...prev,
        priority: "NORMAL",
        date: defaultDT.date,
        time: defaultDT.time,
        timeSlot: null, // Reset timeSlot
      }));
      setToday(defaultDT.date);
      setMinTime(defaultDT.time);
      setIsAfterCutoff(defaultDT.isAfterCutoff);
    }
  };

  const handlePaymentTypeChange = (
    type: "COLLECT" | "PAY",
    checked: boolean,
  ): void => {
    if (checked) {
      setForm((prev: any) => ({ ...prev, paymentType: type }));
    } else {
      setForm((prev: any) => ({
        ...prev,
        paymentType: null,
        amountVND: "",
        amountUSD: "",
      }));
    }
  };

  const formatCurrency = (value: string): string => {
    const num = parseInt(value.replace(/,/g, ""));
    if (isNaN(num)) return "";
    return new Intl.NumberFormat("en-US").format(num);
  };

  // ==================== SUBMIT ====================
  const handleSubmit = async (): Promise<void> => {
    // Đánh dấu tất cả field đã touched trước khi submit
    setTouched({
      department: true,
      senderName: true,
      company: true,
      addressLine: true,
      purpose: true,
      time: true,
      date: true,
    });

    // Kiểm tra thời gian
    if (!isTimeValid()) {
      setNotify({
        visible: true,
        type: "error",
        message: "Không thể chọn thời gian trong quá khứ",
      });
      return;
    }

    if (!validateForm()) {
      setNotify({
        visible: true,
        type: "error",
        message: "Vui lòng điền đầy đủ thông tin bắt buộc",
      });
      return;
    }

    setLoading(true);

    const convertDateToAPI = (dateStr: string): string => {
      if (!dateStr) return "";
      if (dateStr.includes("/")) {
        const [day, month, year] = dateStr.split("/");
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
      return dateStr;
    };

    try {
      const dept = departments.find((d) => d.id === form.department);
      const attachments = customAttachments
        .filter((a) => a.name?.trim())
        .map((a) => ({
          name: a.name.trim(),
          qty: a.qty || 1,
          is_original: a.is_original ? 1 : 0,
          is_original_hph: a.is_original_hph ? 1 : 0,
          is_copy: a.is_copy ? 1 : 0,
          detail: a.detail || null,
          note: a.note || null,
          external_profile_id: a.external_profile_id ?? null,
          external_visa_type_id: form.visaType1 ?? null,
          external_visa_detail_id: form.visaType2 ?? null,
        }));
      const payload: any = {
        department_id: form.department,
        external_department_id: dept?.external_id ?? null,
        external_sender_id: form.senderId,
        sender_name: form.senderName,
        sender_phone: form.senderPhone,
        sender_email: form.senderEmail,
        company: form.company,
        external_company_id: form.companyId,
        address: form.addressLine,
        tax_code: form.taxCode,
        contact: form.contact,
        contact_id: form.contactId,
        phone: form.phone,
        time: form.time,
        time_slot: form.timeSlot,
        date: convertDateToAPI(form.date),
        purpose: form.purpose,
        priority: form.priority,
        notes: form.notes,
        amount_vnd: form.amountVND
          ? parseInt(form.amountVND.replace(/,/g, ""))
          : 0,
        amount_usd: form.amountUSD
          ? parseInt(form.amountUSD.replace(/,/g, ""))
          : 0,
        payment_type: form.paymentType,
        attachments,
        order_type: form.orderType,
        files_to_delete: filesToDelete,
        external_visa_type_id: form.visaType1 ?? null,
        external_visa_detail_id: form.visaType2 ?? null,
        profile_code: dept?.code ?? "",
      };
      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));
      uploadedFiles.forEach((file) => {
        formData.append("files", {
          uri: file.uri,
          type: file.mimeType || "application/octet-stream",
          name: file.name || "file",
        } as any);
      });
      if (isEditMode && orderData) {
        await orderService.updateOrder(orderData.id, formData);
      } else {
        await orderService.createOrder(formData);
      }
      setNotify({
        visible: true,
        type: "success",
        message: isEditMode
          ? "Cập nhật yêu cầu thành công"
          : "Tạo yêu cầu thành công",
      });
      setTimeout(() => navigation.goBack(), 1200);
    } catch (err: any) {
      console.log("Submit error:", err);
      setNotify({
        visible: true,
        type: "error",
        message: err?.response?.data?.message || "Có lỗi xảy ra",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDateValue = (): Date => {
    if (form.date) {
      // Parse từ format DD/MM/YYYY
      const [day, month, year] = form.date.split("/").map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date();
  };

  const getMinimumDate = (): Date => {
    const [day, month, year] = today.split("/").map(Number);
    return new Date(year, month - 1, day);
  };

  const getTimeValue = (): Date => {
    if (form.time) {
      const [h, m] = form.time.split(":");
      const d = new Date();
      d.setHours(+h, +m, 0, 0);
      return d;
    }
    return new Date();
  };

  const getDateTimeLabel = (): string =>
    form.orderType === "PICKUP" ? "Thời gian nhận" : "Thời gian giao";

  const departmentDropdownData: DropdownItem[] = departments.map((d) => ({
    label: d.name,
    value: d.id,
  }));
  const contactDropdownData: DropdownItem[] = availableContacts.map((c) => ({
    label: `${c.name} - ${c.phone}`,
    value: c.id,
  }));
  const visaLevel1Data: DropdownItem[] = visaLevel1.map((v) => ({
    label: v.name,
    value: v.id,
  }));
  const visaLevel2Data: DropdownItem[] = visaLevel2.map((v) => ({
    label: v.name,
    value: v.id,
  }));

  // ==================== RENDER ====================
  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? "Chỉnh sửa yêu cầu" : "Tạo yêu cầu mới"}
        </Text>
        <View style={styles.headerButton} />
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION 1: BASIC INFO */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>THÔNG TIN CƠ BẢN</Text>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Bộ phận <Text style={styles.required}>*</Text>
              </Text>
              <Dropdown
                style={[
                  styles.dropdown,
                  showError("department") && styles.dropdownError,
                ]}
                data={departmentDropdownData}
                labelField="label"
                valueField="value"
                placeholder="Chọn bộ phận"
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                value={form.department}
                disable={!isSuperAdmin && isNVAdmin && !isEditMode}
                onChange={(item: DropdownItem) => {
                  setForm((prev: any) => ({
                    ...prev,
                    department: item.value,
                    senderName: "",
                    senderId: null,
                    senderPhone: "",
                    senderEmail: "",
                    visaType1: null,
                    visaType2: null,
                  }));
                  setCustomAttachments([]);
                  setAvailableAttachments([]);
                  setErrors((prev: any) => ({
                    ...prev,
                    department: undefined,
                  }));
                  setTouched((prev) => ({ ...prev, department: true }));
                }}
              />
              {showError("department") && (
                <Text style={styles.errorText}>{errors.department}</Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Người yêu cầu <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  showError("senderName") && styles.inputError,
                ]}
                onPress={() => setShowSenderDropdown(true)}
              >
                <Text
                  style={
                    form.senderName ? styles.inputText : styles.placeholderText
                  }
                >
                  {form.senderName || "Chọn người yêu cầu"}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#9ca3af" />
              </TouchableOpacity>
              {showError("senderName") && (
                <Text style={styles.errorText}>{errors.senderName}</Text>
              )}
              {form.senderPhone ? (
                <Text style={styles.helperText}>📞 {form.senderPhone}</Text>
              ) : null}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Loại yêu cầu <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    form.orderType === "DELIVERY" && styles.radioActive,
                  ]}
                  onPress={() =>
                    setForm((prev: any) => ({ ...prev, orderType: "DELIVERY" }))
                  }
                >
                  <Ionicons
                    name="send-outline"
                    size={16}
                    color={
                      form.orderType === "DELIVERY" ? "#2563eb" : "#9ca3af"
                    }
                  />
                  <Text
                    style={[
                      styles.radioText,
                      form.orderType === "DELIVERY" && styles.radioTextActive,
                    ]}
                  >
                    Giao hồ sơ
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    form.orderType === "PICKUP" && styles.radioActive,
                  ]}
                  onPress={() =>
                    setForm((prev: any) => ({ ...prev, orderType: "PICKUP" }))
                  }
                >
                  <Ionicons
                    name="download-outline"
                    size={16}
                    color={form.orderType === "PICKUP" ? "#2563eb" : "#9ca3af"}
                  />
                  <Text
                    style={[
                      styles.radioText,
                      form.orderType === "PICKUP" && styles.radioTextActive,
                    ]}
                  >
                    Nhận hồ sơ
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* SECTION 2: CUSTOMER INFO */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>THÔNG TIN KHÁCH HÀNG</Text>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Tên công ty / Khách hàng <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  showError("company") && styles.inputError,
                ]}
                placeholder="Nhập tên công ty để tìm kiếm..."
                placeholderTextColor="#9ca3af"
                value={form.company}
                onChangeText={(text: string) => {
                  setSelectedCompany(null);
                  setForm((prev: any) => ({
                    ...prev,
                    company: text,
                    companyId: null,
                  }));
                  searchCompanies(text);
                  setShowCompanyDropdown(true);

                  // Luôn set touched khi có thay đổi (trừ khi là edit mode và chưa touched)
                  if (!isEditMode || touched.company || text !== form.company) {
                    setTouched((prev) => ({ ...prev, company: true }));
                  }
                }}
                onFocus={() => {
                  if (companies.length > 0) setShowCompanyDropdown(true);
                  // Trong create mode, set touched ngay khi focus
                  if (!isEditMode && !touched.company) {
                    setTouched((prev) => ({ ...prev, company: true }));
                  }
                }}
              />
              {showError("company") && (
                <Text style={styles.errorText}>{errors.company}</Text>
              )}
              {showCompanyDropdown &&
                (companies.length > 0 || companyLoading) && (
                  <View style={styles.dropdownList}>
                    <ScrollView
                      style={styles.dropdownScroll}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                      onScroll={({ nativeEvent }) => {
                        const {
                          layoutMeasurement,
                          contentOffset,
                          contentSize,
                        } = nativeEvent;
                        if (
                          layoutMeasurement.height + contentOffset.y >=
                          contentSize.height - 20
                        )
                          loadMoreCompanies();
                      }}
                      scrollEventThrottle={400}
                    >
                      {companies.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          style={styles.dropdownItem}
                          onPress={() => applyCompanyData(c)}
                        >
                          <Text style={styles.dropdownItemText}>
                            {c.company_name}
                          </Text>
                          {c.tax_code && (
                            <Text style={styles.dropdownItemSub}>
                              MST: {c.tax_code}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                      {companyLoading && (
                        <View style={styles.loadingFooter}>
                          <ActivityIndicator size="small" color="#2563eb" />
                          <Text style={styles.loadingFooterText}>
                            Đang tải thêm...
                          </Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Mã số thuế</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập mã số thuế để tự động điền"
                placeholderTextColor="#9ca3af"
                value={form.taxCode}
                onChangeText={(text: string) =>
                  setForm((prev: any) => ({ ...prev, taxCode: text }))
                }
                keyboardType="numeric"
              />
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Số điện thoại</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập SĐT để tìm kiếm (ít nhất 5 số)"
                placeholderTextColor="#9ca3af"
                value={form.phone} // 👈 Hiển thị trực tiếp, không format
                onChangeText={(text: string) => {
                  // Xóa khoảng trắng và chỉ giữ lại số
                  const cleaned = text.replace(/\s+/g, "").replace(/\D/g, "");

                  setForm((prev: any) => ({ ...prev, phone: cleaned }));
                  searchByPhone(cleaned);

                  if (cleaned.length >= 5) {
                    setShowPhoneDropdown(true);
                  } else {
                    setShowPhoneDropdown(false);
                  }

                  // Reset phone select khi nhập tay
                  if (phoneList.length > 1) {
                    setShowPhoneSelect(false);
                    setPhoneList([]);
                  }
                }}
                onFocus={() => {
                  if (phoneResults.length > 0) setShowPhoneDropdown(true);
                }}
                keyboardType="phone-pad"
                maxLength={11}
              />
              {showPhoneDropdown &&
                (phoneResults.length > 0 || phoneLoading) && (
                  <View style={styles.dropdownList}>
                    <ScrollView
                      style={styles.dropdownScroll}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                      onScroll={({ nativeEvent }) => {
                        const {
                          layoutMeasurement,
                          contentOffset,
                          contentSize,
                        } = nativeEvent;
                        if (
                          layoutMeasurement.height + contentOffset.y >=
                          contentSize.height - 20
                        )
                          loadMorePhones();
                      }}
                      scrollEventThrottle={400}
                    >
                      {phoneResults.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.dropdownItem}
                          onPress={() => applyCompanyData(item as any)}
                        >
                          <Text style={styles.dropdownItemText}>
                            {item.company_name}
                          </Text>
                          <Text style={styles.dropdownItemSub}>
                            📞 {item.phone}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      {phoneLoading && (
                        <View style={styles.loadingFooter}>
                          <ActivityIndicator size="small" color="#2563eb" />
                          <Text style={styles.loadingFooterText}>
                            Đang tải thêm...
                          </Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
              {showPhoneSelect && phoneList.length > 1 && (
                <View style={styles.phoneSelectContainer}>
                  <Text style={styles.phoneSelectLabel}>
                    Chọn số điện thoại:
                  </Text>
                  <View style={styles.phoneSelectList}>
                    {phoneList.map((phone, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.phoneSelectItem,
                          selectedPhoneIndex === index &&
                            styles.phoneSelectItemActive,
                        ]}
                        onPress={() => handlePhoneSelect(phone, index)}
                      >
                        <Ionicons
                          name="call-outline"
                          size={14}
                          color={
                            selectedPhoneIndex === index ? "#2563eb" : "#6b7280"
                          }
                        />
                        <Text
                          style={[
                            styles.phoneSelectText,
                            selectedPhoneIndex === index &&
                              styles.phoneSelectTextActive,
                          ]}
                        >
                          {phone} {/* 👈 Hiển thị trực tiếp, không format */}
                        </Text>
                        {selectedPhoneIndex === index && (
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color="#2563eb"
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Người liên hệ (Gặp)</Text>
              {availableContacts.length > 1 ? (
                <Dropdown
                  style={styles.dropdown}
                  data={contactDropdownData}
                  labelField="label"
                  valueField="value"
                  placeholder="Chọn người liên hệ"
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  value={form.contactId}
                  onChange={(item: DropdownItem) => {
                    const contact = availableContacts.find(
                      (c) => c.id === item.value,
                    );
                    if (contact)
                      setForm((prev: any) => ({
                        ...prev,
                        contactId: contact.id,
                        contact: contact.name,
                        phone: (contact.phone ?? "").replace(/\D/g, ""),
                      }));
                  }}
                />
              ) : (
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tên người liên hệ"
                  placeholderTextColor="#9ca3af"
                  value={form.contact}
                  onChangeText={(text: string) => {
                    setForm((prev: any) => ({
                      ...prev,
                      contact: text,
                      contactId: null,
                    }));
                    setIsContactFromSelection(false);
                    searchByContact(text);
                    if (text) setShowContactDropdown(true);
                  }}
                />
              )}
              {availableContacts.length > 1 && (
                <Text style={styles.helperText}>
                  Có {availableContacts.length} người liên hệ
                </Text>
              )}
              {showContactDropdown &&
                (contactResults.length > 0 || contactLoading) && (
                  <View style={styles.dropdownList}>
                    <ScrollView
                      style={styles.dropdownScroll}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                      onScroll={({ nativeEvent }) => {
                        const {
                          layoutMeasurement,
                          contentOffset,
                          contentSize,
                        } = nativeEvent;
                        if (
                          layoutMeasurement.height + contentOffset.y >=
                          contentSize.height - 20
                        )
                          loadMoreContacts();
                      }}
                      scrollEventThrottle={400}
                    >
                      {contactResults.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.dropdownItem}
                          onPress={() => applyCompanyData(item as any)}
                        >
                          <Text style={styles.dropdownItemText}>
                            {item.contactName}
                          </Text>
                          <Text style={styles.dropdownItemSub}>
                            🏢 {item.company_name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      {contactLoading && (
                        <View style={styles.loadingFooter}>
                          <ActivityIndicator size="small" color="#2563eb" />
                          <Text style={styles.loadingFooterText}>
                            Đang tải thêm...
                          </Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
            </View>
          </View>

          {/* SECTION 3: ADDRESS */}
          <View style={styles.section}>
            {/* <Text style={styles.sectionTitle}>ĐỊA CHỈ GIAO NHẬN</Text> */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Địa chỉ giao nhận <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  showError("addressLine") && styles.inputError,
                ]}
                placeholder="Ví dụ: 186-188 Nguyễn Duy, Phường 9, Quận 8, TP.HCM"
                placeholderTextColor="#9ca3af"
                value={form.addressLine}
                onChangeText={(text: string) => {
                  setForm((prev: any) => ({ ...prev, addressLine: text }));
                  setErrors((prev: any) => ({
                    ...prev,
                    addressLine: undefined,
                  }));
                  setTouched((prev) => ({ ...prev, addressLine: true }));
                }}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                readOnly
              />
              {showError("addressLine") && (
                <Text style={styles.errorText}>{errors.addressLine}</Text>
              )}
            </View>
          </View>

          {/* SECTION 4: DATE & TIME */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {getDateTimeLabel().toUpperCase()}
            </Text>
            <View style={styles.row}>
              <View style={[styles.fieldContainer, styles.flex1]}>
                <Text style={styles.label}>
                  Ngày <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.input, showError("date") && styles.inputError]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text
                    style={
                      form.date ? styles.inputText : styles.placeholderText
                    }
                  >
                    {form.date || "Chọn ngày"}
                  </Text>
                  <Ionicons name="calendar-outline" size={16} color="#9ca3af" />
                </TouchableOpacity>
                {showError("date") && (
                  <Text style={styles.errorText}>{errors.date}</Text>
                )}
              </View>
              <View
                style={[styles.fieldContainer, styles.flex1, styles.marginLeft]}
              >
                <Text style={styles.label}>
                  Giờ {!form.timeSlot && <Text style={styles.required}>*</Text>}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.input,
                    showError("time") && styles.inputError,
                    form.timeSlot && styles.inputDisabled, // Style disabled khi có timeSlot
                  ]}
                  onPress={() => !form.timeSlot && setShowTimePicker(true)}
                  disabled={!!form.timeSlot}
                >
                  <Text
                    style={
                      form.time
                        ? styles.inputText
                        : form.timeSlot
                          ? styles.placeholderText
                          : styles.placeholderText
                    }
                  >
                    {form.time || (form.timeSlot ? "--:--" : "Chọn giờ")}
                  </Text>
                  <Ionicons name="time-outline" size={16} color="#9ca3af" />
                </TouchableOpacity>
                {!form.timeSlot && showError("time") && (
                  <Text style={styles.errorText}>{errors.time}</Text>
                )}
                {!form.timeSlot && !isTimeValid() && form.time && form.date && (
                  <Text style={styles.warningText}>
                    Không thể chọn thời gian trong quá khứ
                  </Text>
                )}
              </View>
            </View>

            {/* Radio chọn buổi */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Hoặc chọn buổi giao/nhận</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    form.timeSlot === "MORNING" && styles.radioActive,
                  ]}
                  onPress={() => {
                    setForm((prev: any) => ({
                      ...prev,
                      timeSlot: "MORNING",
                      time: "", // Clear time khi chọn buổi
                    }));
                    setTouched((prev) => ({ ...prev, time: true }));
                  }}
                >
                  <Ionicons
                    name="sunny-outline"
                    size={16}
                    color={form.timeSlot === "MORNING" ? "#2563eb" : "#9ca3af"}
                  />
                  <Text
                    style={[
                      styles.radioText,
                      form.timeSlot === "MORNING" && styles.radioTextActive,
                    ]}
                  >
                    Buổi sáng (8:00 - 12:00)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    form.timeSlot === "AFTERNOON" && styles.radioActive,
                  ]}
                  onPress={() => {
                    setForm((prev: any) => ({
                      ...prev,
                      timeSlot: "AFTERNOON",
                      time: "", // Clear time khi chọn buổi
                    }));
                    setTouched((prev) => ({ ...prev, time: true }));
                  }}
                >
                  <Ionicons
                    name="partly-sunny-outline"
                    size={16}
                    color={
                      form.timeSlot === "AFTERNOON" ? "#2563eb" : "#9ca3af"
                    }
                  />
                  <Text
                    style={[
                      styles.radioText,
                      form.timeSlot === "AFTERNOON" && styles.radioTextActive,
                    ]}
                  >
                    Buổi chiều (13:30 - 17:00)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Nút xóa chọn buổi */}
              {form.timeSlot && (
                <TouchableOpacity
                  style={styles.clearTimeSlotButton}
                  onPress={() => {
                    setForm((prev: any) => ({
                      ...prev,
                      timeSlot: null,
                      time: defaultDT.time, // Reset về giờ mặc định
                    }));
                  }}
                >
                  <Ionicons name="close-circle" size={16} color="#6b7280" />
                  <Text style={styles.clearTimeSlotText}>Xóa chọn buổi</Text>
                </TouchableOpacity>
              )}

              {/* Cảnh báo khi chọn buổi */}
              {form.timeSlot && (
                <View style={styles.timeSlotWarning}>
                  <Ionicons name="warning-outline" size={16} color="#f59e0b" />
                  <Text style={styles.timeSlotWarningText}>
                    Khi chọn buổi, đơn sẽ không hiển thị giờ giao/nhận cụ thể mà
                    chỉ hiển thị buổi giao/nhận
                  </Text>
                </View>
              )}
            </View>

            {/* Priority checkbox */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={togglePriority}
            >
              <Ionicons
                name={form.priority === "HIGH" ? "checkbox" : "square-outline"}
                size={20}
                color={form.priority === "HIGH" ? "#dc2626" : "#9ca3af"}
              />
              <Text
                style={[
                  styles.checkboxLabel,
                  { color: form.priority === "HIGH" ? "#dc2626" : "#374151" },
                ]}
              >
                Giao hồ sơ khẩn cấp
              </Text>
            </TouchableOpacity>

            {isAfterCutoff && form.priority !== "HIGH" && (
              <Text style={styles.warningText}>
                Sau 11:30, chỉ có thể chọn thời gian từ ngày mai (08:00 trở đi)
              </Text>
            )}
            {form.priority === "HIGH" && (
              <Text style={styles.warningText}>
                Hồ sơ khẩn chỉ được chọn ngày hôm nay
              </Text>
            )}
          </View>

          {/* SECTION 6: PURPOSE */}
          <View style={styles.section}>
            {/* <Text style={styles.sectionTitle}>THÔNG TIN YÊU CẦU</Text> */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Thông tin yêu cầu <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  showError("purpose") && styles.inputError,
                ]}
                placeholder="Ví dụ: Giao hồ sơ, Lấy dấu hoặc ghi chú cần thiết..."
                placeholderTextColor="#9ca3af"
                value={form.purpose}
                onChangeText={(text: string) => {
                  setForm((prev: any) => ({ ...prev, purpose: text }));
                  setErrors((prev: any) => ({ ...prev, purpose: undefined }));
                  setTouched((prev) => ({ ...prev, purpose: true }));
                }}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              {showError("purpose") && (
                <Text style={styles.errorText}>{errors.purpose}</Text>
              )}
            </View>
          </View>

          {/* SECTION 7: PAYMENT */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>THÔNG TIN THANH TOÁN</Text>
            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() =>
                  handlePaymentTypeChange(
                    "COLLECT",
                    form.paymentType !== "COLLECT",
                  )
                }
              >
                <Ionicons
                  name={
                    form.paymentType === "COLLECT"
                      ? "checkbox"
                      : "square-outline"
                  }
                  size={20}
                  color={form.paymentType === "COLLECT" ? "#2563eb" : "#9ca3af"}
                />
                <Text style={styles.checkboxLabel}>Thu tiền</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() =>
                  handlePaymentTypeChange("PAY", form.paymentType !== "PAY")
                }
              >
                <Ionicons
                  name={
                    form.paymentType === "PAY" ? "checkbox" : "square-outline"
                  }
                  size={20}
                  color={form.paymentType === "PAY" ? "#2563eb" : "#9ca3af"}
                />
                <Text style={styles.checkboxLabel}>Thanh toán</Text>
              </TouchableOpacity>
            </View>
            {form.paymentType && (
              <View style={styles.row}>
                <View style={[styles.fieldContainer, styles.flex1]}>
                  <Text style={styles.label}>Số tiền (VNĐ)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#9ca3af"
                    value={form.amountVND}
                    onChangeText={(text: string) =>
                      setForm((prev: any) => ({
                        ...prev,
                        amountVND: formatCurrency(text),
                      }))
                    }
                    keyboardType="numeric"
                  />
                </View>
                <View
                  style={[
                    styles.fieldContainer,
                    styles.flex1,
                    styles.marginLeft,
                  ]}
                >
                  <Text style={styles.label}>Số tiền (USD)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#9ca3af"
                    value={form.amountUSD}
                    onChangeText={(text: string) =>
                      setForm((prev: any) => ({
                        ...prev,
                        amountUSD: formatCurrency(text),
                      }))
                    }
                    keyboardType="numeric"
                  />
                </View>
              </View>
            )}
          </View>

          {/* SECTION 5: VISA VN */}
          {isVisaVN && (
            <View style={styles.section}>
              {/* <Text style={styles.sectionTitle}>THÔNG TIN VISA</Text> */}
              <View style={styles.row}>
                <View style={[styles.fieldContainer, styles.flex1]}>
                  <Text style={styles.label}>Loại Visa</Text>
                  <Dropdown
                    style={styles.dropdown}
                    data={visaLevel1Data}
                    labelField="label"
                    valueField="value"
                    placeholder="-- Chọn loại --"
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    value={form.visaType1}
                    onChange={(item: DropdownItem) => {
                      setForm((prev: any) => ({
                        ...prev,
                        visaType1: item.value,
                        visaType2: null,
                      }));
                      setVisaLevel2([]);
                      setCustomAttachments([]);
                      setAvailableAttachments([]);
                    }}
                  />
                </View>
                <View
                  style={[
                    styles.fieldContainer,
                    styles.flex1,
                    styles.marginLeft,
                  ]}
                >
                  <Text style={styles.label}>Chi tiết</Text>
                  <Dropdown
                    style={styles.dropdown}
                    data={visaLevel2Data}
                    labelField="label"
                    valueField="value"
                    placeholder="-- Chọn chi tiết --"
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    value={form.visaType2}
                    disable={!form.visaType1 || loadingVisaLevel2}
                    onChange={(item: DropdownItem) => {
                      setForm((prev: any) => ({
                        ...prev,
                        visaType2: item.value,
                      }));
                      setCustomAttachments([]);
                      setAvailableAttachments([]);
                    }}
                  />
                  {loadingVisaLevel2 && (
                    <ActivityIndicator
                      size="small"
                      color="#2563eb"
                      style={{ marginTop: 4 }}
                    />
                  )}
                </View>
              </View>
            </View>
          )}

          {/* SECTION 8: ATTACHMENTS */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>CHECKLIST HỒ SƠ</Text>
            </View>
            <View style={styles.attachmentActions}>
              {availableAttachments.length > 0 && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setShowAvailableModal(true)}
                >
                  <Ionicons name="list-outline" size={12} color="#374151" />
                  <Text style={styles.actionBtnText}>
                    Thêm có sẵn ({availableAttachments.length})
                  </Text>
                </TouchableOpacity>
              )}
              {hasSelectedAttachments() && (
                <TouchableOpacity
                  style={styles.actionBtnPrimary}
                  onPress={() => setShowBulkDetailModal(true)}
                >
                  <Ionicons name="create-outline" size={12} color="#fff" />
                  <Text style={styles.actionBtnTextPrimary}>Thêm chi tiết</Text>
                </TouchableOpacity>
              )}
              {customAttachments.length > 0 && (
                <>
                  <TouchableOpacity
                    style={styles.actionBtnOutline}
                    onPress={toggleSelectAllCustom}
                  >
                    <Text style={styles.actionBtnTextOutline}>
                      {isAllSelected() ? "Bỏ chọn" : "Chọn tất cả"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtnDanger}
                    onPress={clearAllCustom}
                  >
                    <Ionicons name="trash-outline" size={12} color="#ef4444" />
                    <Text style={styles.actionBtnTextDanger}>Xoá tất cả</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={styles.addCircleBtn}
                onPress={addNewAttachment}
              >
                <Ionicons name="add-circle" size={28} color="#2563eb" />
              </TouchableOpacity>
            </View>

            {customAttachments.map((att, index) => (
              <View key={index} style={styles.attachmentCard}>
                <View style={styles.attachmentHeader}>
                  <TouchableOpacity
                    onPress={() =>
                      updateAttachmentField(index, "selected", !att.selected)
                    }
                  >
                    <Ionicons
                      name={att.selected ? "checkbox" : "square-outline"}
                      size={18}
                      color={att.selected ? "#2563eb" : "#9ca3af"}
                    />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.attachmentNameInput}
                    placeholder="Tên hồ sơ..."
                    placeholderTextColor="#9ca3af"
                    value={att.name}
                    onChangeText={(text: string) =>
                      updateAttachmentField(index, "name", text)
                    }
                  />
                  <TouchableOpacity onPress={() => removeAttachment(index)}>
                    <Ionicons name="close-circle" size={22} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    style={styles.qtyButtonTouch}
                    onPress={() => updateAttachmentQty(index, -1)}
                  >
                    <Text style={styles.qtyButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{att.qty}</Text>
                  <TouchableOpacity
                    style={styles.qtyButtonTouch}
                    onPress={() => updateAttachmentQty(index, 1)}
                  >
                    <Text style={styles.qtyButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.checkboxRow}>
                  <TouchableOpacity
                    style={styles.smallCheckbox}
                    onPress={() =>
                      updateAttachmentField(
                        index,
                        "is_original",
                        !att.is_original,
                      )
                    }
                  >
                    <Ionicons
                      name={att.is_original ? "checkbox" : "square-outline"}
                      size={16}
                      color={att.is_original ? "#2563eb" : "#9ca3af"}
                    />
                    <Text style={styles.smallCheckboxLabel}>Bản gốc</Text>
                  </TouchableOpacity>
                  {!shouldShowHPH() && (
                    <TouchableOpacity
                      style={styles.smallCheckbox}
                      onPress={() =>
                        updateAttachmentField(
                          index,
                          "is_original_hph",
                          !att.is_original_hph,
                        )
                      }
                    >
                      <Ionicons
                        name={
                          att.is_original_hph ? "checkbox" : "square-outline"
                        }
                        size={16}
                        color={att.is_original_hph ? "#2563eb" : "#9ca3af"}
                      />
                      <Text style={styles.smallCheckboxLabel}>Bản gốc HPH</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.smallCheckbox}
                    onPress={() =>
                      updateAttachmentField(index, "is_copy", !att.is_copy)
                    }
                  >
                    <Ionicons
                      name={att.is_copy ? "checkbox" : "square-outline"}
                      size={16}
                      color={att.is_copy ? "#2563eb" : "#9ca3af"}
                    />
                    <Text style={styles.smallCheckboxLabel}>Bản sao</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() =>
                    updateAttachmentField(index, "showDetail", !att.showDetail)
                  }
                >
                  <Text style={styles.toggleButtonText}>
                    {att.showDetail || att.detail
                      ? "Ẩn chi tiết"
                      : "+ Chi tiết"}
                  </Text>
                </TouchableOpacity>
                {(att.showDetail || att.detail) && (
                  <TextInput
                    style={styles.detailInput}
                    placeholder="Nhập chi tiết..."
                    placeholderTextColor="#9ca3af"
                    value={att.detail}
                    onChangeText={(text: string) =>
                      updateAttachmentField(index, "detail", text)
                    }
                    multiline
                    textAlignVertical="top"
                  />
                )}
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() =>
                    updateAttachmentField(index, "showNote", !att.showNote)
                  }
                >
                  <Text style={styles.toggleButtonText}>
                    {att.showNote || att.note ? "Ẩn ghi chú" : "+ Ghi chú"}
                  </Text>
                </TouchableOpacity>
                {(att.showNote || att.note) && (
                  <TextInput
                    style={styles.detailInput}
                    placeholder="Nhập ghi chú..."
                    placeholderTextColor="#9ca3af"
                    value={att.note}
                    onChangeText={(text: string) =>
                      updateAttachmentField(index, "note", text)
                    }
                    multiline
                    textAlignVertical="top"
                  />
                )}
              </View>
            ))}
            {customAttachments.length === 0 && (
              <TouchableOpacity
                style={styles.emptyAttachments}
                onPress={addNewAttachment}
              >
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color="#9ca3af"
                />
                <Text style={styles.emptyText}>
                  Bấm "+" hoặc tại đây để thêm hồ sơ cần bàn giao
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* SECTION 9: FILES */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TÀI LIỆU ĐÍNH KÈM</Text>
            {existingFiles.length > 0 && (
              <View style={styles.fileList}>
                {existingFiles.map((file) => (
                  <View
                    key={file.id}
                    style={[
                      styles.fileItem,
                      file._deleting && styles.fileDeleting,
                    ]}
                  >
                    <View style={styles.fileIconContainer}>
                      <Ionicons
                        name={
                          file.type.includes("pdf")
                            ? "document-text"
                            : file.type.includes("image")
                              ? "image"
                              : "document"
                        }
                        size={20}
                        color="#6b7280"
                      />
                    </View>
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <Text style={styles.fileType}>
                        {file.type.split("/")[1]?.toUpperCase() || "FILE"}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeExistingFile(file)}>
                      <Ionicons name="close" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity style={styles.uploadArea} onPress={pickDocument}>
              <Ionicons name="cloud-upload-outline" size={36} color="#9ca3af" />
              <Text style={styles.uploadText}>Chọn file để tải lên</Text>
              <Text style={styles.uploadSubtext}>
                PDF, Ảnh, Word - Tối đa 5MB/file
              </Text>
            </TouchableOpacity>
            {uploadedFiles.length > 0 && (
              <View style={styles.fileList}>
                {uploadedFiles.map((file, index) => (
                  <View key={index} style={styles.fileItem}>
                    <View style={styles.fileIconContainer}>
                      <Ionicons
                        name="document-attach"
                        size={20}
                        color="#2563eb"
                      />
                    </View>
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <Text style={styles.fileSize}>
                        {file.size
                          ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                          : "Mới"}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeUploadedFile(index)}>
                      <Ionicons name="close" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* SUBMIT */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isFormValid || !isTimeValid() || loading) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid || !isTimeValid() || loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                !isFormValid || !isTimeValid() || loading
                  ? ["#9ca3af", "#6b7280"]
                  : ["#3B82F6", "#2563EB"]
              }
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons
                    name={isEditMode ? "save" : "paper-plane"}
                    size={18}
                    color="#fff"
                    style={styles.submitIcon}
                  />
                  <Text style={styles.submitText}>
                    {isEditMode ? "CẬP NHẬT YÊU CẦU" : "TẠO YÊU CẦU"}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* DATE PICKER */}
      {showDatePicker &&
        (Platform.OS === "ios" ? (
          <Modal
            transparent={true}
            animationType="slide"
            visible={showDatePicker}
            onRequestClose={() => setShowDatePicker(false)}
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setShowDatePicker(false)}
            >
              <View style={styles.datePickerModalContent}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={handleDateCancel}>
                    <Text style={styles.datePickerCancelText}>Huỷ</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerTitle}>Chọn ngày</Text>
                  <TouchableOpacity onPress={handleDateConfirm}>
                    <Text style={styles.datePickerConfirmText}>Xong</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={getDateValue()}
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setTempDate(selectedDate);
                    }
                  }}
                  minimumDate={getMinimumDate()}
                />
              </View>
            </Pressable>
          </Modal>
        ) : (
          <DateTimePicker
            value={getDateValue()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (event.type !== "dismissed" && selectedDate) {
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(
                  2,
                  "0",
                );
                const day = String(selectedDate.getDate()).padStart(2, "0");
                const newDate = `${day}/${month}/${year}`;

                setForm((prev: any) => ({ ...prev, date: newDate }));
                setTouched((prev) => ({ ...prev, date: true }));

                const now = new Date();
                const todayStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

                if (newDate === todayStr) {
                  now.setMinutes(now.getMinutes() + 10);
                  setMinTime(now.toTimeString().slice(0, 5));
                } else {
                  setMinTime("");
                }
              }
            }}
            minimumDate={getMinimumDate()}
          />
        ))}

      {/* TIME PICKER */}
      {showTimePicker &&
        (Platform.OS === "ios" ? (
          <Modal
            transparent={true}
            animationType="slide"
            visible={showTimePicker}
            onRequestClose={() => setShowTimePicker(false)}
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setShowTimePicker(false)}
            >
              <View style={styles.datePickerModalContent}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Text style={styles.datePickerCancelText}>Huỷ</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerTitle}>Chọn giờ</Text>
                  <TouchableOpacity
                    onPress={() => {
                      // Xử lý confirm time
                      setShowTimePicker(false);
                    }}
                  >
                    <Text style={styles.datePickerConfirmText}>Xong</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={getTimeValue()}
                  mode="time"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      const hours = selectedDate
                        .getHours()
                        .toString()
                        .padStart(2, "0");
                      const minutes = selectedDate
                        .getMinutes()
                        .toString()
                        .padStart(2, "0");
                      const newTime = `${hours}:${minutes}`;
                      setForm((prev: any) => ({ ...prev, time: newTime }));
                      setTouched((prev) => ({ ...prev, time: true }));
                    }
                  }}
                  minimumDate={
                    form.date ===
                    `${String(new Date().getDate()).padStart(2, "0")}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${new Date().getFullYear()}`
                      ? new Date()
                      : undefined
                  }
                />
              </View>
            </Pressable>
          </Modal>
        ) : (
          <DateTimePicker
            value={getTimeValue()}
            mode="time"
            display="default"
            onChange={handleTimeChange}
            minimumDate={
              form.date ===
              `${String(new Date().getDate()).padStart(2, "0")}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${new Date().getFullYear()}`
                ? new Date()
                : undefined
            }
          />
        ))}

      {/* SENDER MODAL */}
      <Modal
        visible={showSenderDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSenderDropdown(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSenderDropdown(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn người yêu cầu</Text>
              <TouchableOpacity onPress={() => setShowSenderDropdown(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Tìm kiếm người yêu cầu..."
              placeholderTextColor="#9ca3af"
              value={senderKeyword}
              onChangeText={filterSenders}
            />
            <ScrollView
              style={styles.modalList}
              keyboardShouldPersistTaps="handled"
            >
              {filteredSenders.length === 0 ? (
                <Text style={styles.modalEmpty}>
                  Không tìm thấy người yêu cầu
                </Text>
              ) : (
                filteredSenders.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.modalItem,
                      form.senderId === s.id && styles.modalItemActive,
                    ]}
                    onPress={() => selectSender(s)}
                  >
                    <View style={styles.modalItemLeft}>
                      <View style={styles.modalAvatar}>
                        <Text style={styles.modalAvatarText}>
                          {s.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.modalItemName}>{s.name}</Text>
                        <Text style={styles.modalItemEmail}>
                          {s.email || "Không có email"}
                        </Text>
                      </View>
                    </View>
                    {form.senderId === s.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#2563eb"
                      />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* AVAILABLE ATTACHMENTS MODAL */}
      <Modal
        visible={showAvailableModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAvailableModal(false)}
      >
        <View style={styles.availableModalOverlay}>
          <View style={styles.availableModalContainer}>
            {/* Header */}
            <View style={styles.availableModalHeader}>
              <View style={styles.availableModalHandle} />
              <Text style={styles.availableModalTitle}>Chọn hồ sơ có sẵn</Text>
              <TouchableOpacity
                onPress={() => setShowAvailableModal(false)}
                style={styles.availableModalCloseBtn}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Search & Actions */}
            <View style={styles.availableModalSearchContainer}>
              <View style={styles.availableModalSearchInput}>
                <Ionicons name="search-outline" size={18} color="#9ca3af" />
                <TextInput
                  style={styles.availableModalSearchField}
                  placeholder="Tìm kiếm hồ sơ..."
                  placeholderTextColor="#9ca3af"
                  value={searchAvailable}
                  onChangeText={setSearchAvailable}
                />
                {searchAvailable.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchAvailable("")}>
                    <Ionicons name="close-circle" size={18} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Count & Select All */}
            <View style={styles.availableModalInfo}>
              <Text style={styles.availableModalCount}>
                {filteredAvailable().length} hồ sơ
              </Text>
              <TouchableOpacity onPress={toggleSelectAllAvailable}>
                <Text style={styles.availableModalSelectAll}>
                  {allAvailableSelected() ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* List */}
            <ScrollView
              style={styles.availableModalList}
              showsVerticalScrollIndicator={false}
            >
              {filteredAvailable().length === 0 ? (
                <View style={styles.availableModalEmpty}>
                  <Ionicons name="search-outline" size={40} color="#d1d5db" />
                  <Text style={styles.availableModalEmptyText}>
                    {searchAvailable
                      ? "Không tìm thấy hồ sơ phù hợp"
                      : "Danh sách trống"}
                  </Text>
                </View>
              ) : (
                filteredAvailable().map((att, index) => (
                  <TouchableOpacity
                    key={`${att.name}-${index}`}
                    style={[
                      styles.availableModalItem,
                      att.checked && styles.availableModalItemActive,
                    ]}
                    onPress={() => {
                      setAvailableAttachments((prev) =>
                        prev.map((item, i) =>
                          i === index
                            ? { ...item, checked: !item.checked }
                            : item,
                        ),
                      );
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.availableModalItemLeft}>
                      <View
                        style={[
                          styles.availableModalCheckbox,
                          att.checked && styles.availableModalCheckboxActive,
                        ]}
                      >
                        {att.checked && (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.availableModalItemName,
                          att.checked && styles.availableModalItemNameActive,
                        ]}
                      >
                        {att.name}
                      </Text>
                    </View>

                    <View style={styles.availableModalQty}>
                      <TouchableOpacity
                        style={styles.availableModalQtyBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          setAvailableAttachments((prev) =>
                            prev.map((item, i) =>
                              i === index
                                ? {
                                    ...item,
                                    qty: Math.max(1, (item.qty || 1) - 1),
                                  }
                                : item,
                            ),
                          );
                        }}
                      >
                        <Ionicons name="remove" size={18} color="#6b7280" />
                      </TouchableOpacity>

                      <Text style={styles.availableModalQtyText}>
                        {att.qty || 1}
                      </Text>

                      <TouchableOpacity
                        style={styles.availableModalQtyBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          setAvailableAttachments((prev) =>
                            prev.map((item, i) =>
                              i === index
                                ? { ...item, qty: (item.qty || 1) + 1 }
                                : item,
                            ),
                          );
                        }}
                      >
                        <Ionicons name="add" size={18} color="#6b7280" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.availableModalFooter}>
              <TouchableOpacity
                style={styles.availableModalCancelBtn}
                onPress={() => setShowAvailableModal(false)}
              >
                <Text style={styles.availableModalCancelText}>Huỷ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.availableModalConfirmBtn,
                  availableAttachments.filter((a) => a.checked).length === 0 &&
                    styles.availableModalConfirmBtnDisabled,
                ]}
                onPress={confirmAddAvailable}
                disabled={
                  availableAttachments.filter((a) => a.checked).length === 0
                }
              >
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.availableModalConfirmText}>
                  Thêm{" "}
                  {availableAttachments.filter((a) => a.checked).length > 0
                    ? `(${availableAttachments.filter((a) => a.checked).length})`
                    : ""}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* BULK DETAIL MODAL */}
      <Modal
        visible={showBulkDetailModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBulkDetailModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowBulkDetailModal(false)}
        >
          <Pressable
            style={styles.modalContentSmall}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nhập chi tiết chung</Text>
              <TouchableOpacity onPress={() => setShowBulkDetailModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.detailInput, { minHeight: 120 }]}
                placeholder="Nhập chi tiết để áp dụng chung nhiều hồ sơ..."
                placeholderTextColor="#9ca3af"
                value={bulkDetail}
                onChangeText={setBulkDetail}
                multiline
                textAlignVertical="top"
              />
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowBulkDetailModal(false)}
              >
                <Text style={styles.modalCancelText}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={applyBulkDetail}
              >
                <Text style={styles.modalConfirmText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <AppNotification
        visible={notify.visible}
        type={notify.type}
        message={notify.message}
        onHide={() => setNotify((prev: any) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  flex: { flex: 1 },
  flex1: { flex: 1 },
  marginLeft: { marginLeft: 12 },
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  scrollContent: { padding: 16 },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  fieldContainer: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "500", color: "#374151", marginBottom: 6 },
  required: { color: "#ef4444" },
  input: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: "#fff",
    color: "#111827",
  },
  inputError: { borderColor: "#ef4444" },
  inputText: { fontSize: 14, color: "#111827", flex: 1 },
  placeholderText: { fontSize: 14, color: "#9ca3af", flex: 1 },
  placeholderStyle: { fontSize: 14, color: "#9ca3af" },
  selectedTextStyle: { fontSize: 14, color: "#111827" },
  textArea: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    backgroundColor: "#fff",
    color: "#111827",
  },
  errorText: { fontSize: 11, color: "#ef4444", marginTop: 4 },
  helperText: { fontSize: 11, color: "#6b7280", marginTop: 4 },
  dropdown: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: "#fff",
  },
  dropdownError: { borderColor: "#ef4444" },
  dropdownList: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 220,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  dropdownScroll: { maxHeight: 220 },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dropdownItemText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  dropdownItemSub: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  loadingFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  loadingFooterText: { fontSize: 11, color: "#6b7280" },
  row: { flexDirection: "row" },
  radioGroup: { flexDirection: "row", gap: 8 },
  radioButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  radioActive: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  radioText: { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  radioTextActive: { color: "#2563eb", fontWeight: "600" },
  checkboxRow: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  checkboxLabel: { fontSize: 13, color: "#374151", marginLeft: 8 },
  warningText: {
    fontSize: 11,
    color: "#f59e0b",
    marginTop: 8,
    fontStyle: "italic",
  },
  attachmentActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  actionBtnText: { fontSize: 11, color: "#374151", fontWeight: "600" },
  actionBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#2563eb",
    borderRadius: 8,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionBtnTextPrimary: { fontSize: 11, color: "#fff", fontWeight: "600" },
  actionBtnOutline: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: "#2563eb",
    borderRadius: 8,
    backgroundColor: "#eff6ff",
  },
  actionBtnTextOutline: { fontSize: 11, color: "#2563eb", fontWeight: "600" },
  actionBtnDanger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  actionBtnTextDanger: { fontSize: 11, color: "#ef4444", fontWeight: "600" },
  addCircleBtn: { marginLeft: "auto" },
  attachmentCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fafbfc",
  },
  attachmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  attachmentNameInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginBottom: 10,
  },
  qtyButtonTouch: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  qtyButtonText: { fontSize: 16, fontWeight: "700", color: "#374151" },
  qtyText: {
    fontSize: 15,
    fontWeight: "700",
    minWidth: 36,
    textAlign: "center",
    color: "#111827",
  },
  smallCheckbox: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 14,
    paddingVertical: 2,
  },
  smallCheckboxLabel: { fontSize: 12, color: "#6b7280", marginLeft: 4 },
  toggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
    marginTop: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  toggleButtonText: { fontSize: 11, color: "#6b7280", fontWeight: "600" },
  detailInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    marginTop: 8,
    minHeight: 60,
    textAlignVertical: "top",
    color: "#374151",
    backgroundColor: "#fff",
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyAttachments: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 28,
    alignItems: "center",
    gap: 8,
  },
  emptyText: { fontSize: 12, color: "#9ca3af", textAlign: "center" },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  modalCancelText: { fontSize: 13, color: "#6b7280", fontWeight: "600" },
  modalConfirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#2563eb",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modalConfirmBtnDisabled: {
    backgroundColor: "#93c5fd",
    shadowOpacity: 0,
    elevation: 0,
  },
  modalConfirmText: { fontSize: 13, color: "#fff", fontWeight: "600" },
  uploadArea: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 28,
    alignItems: "center",
    backgroundColor: "#fafbfc",
  },
  uploadText: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 8,
    fontWeight: "600",
  },
  uploadSubtext: { fontSize: 11, color: "#9ca3af", marginTop: 4 },
  fileList: { marginTop: 12 },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  fileDeleting: { opacity: 0.5 },
  fileIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 12, color: "#374151", fontWeight: "500" },
  fileType: { fontSize: 10, color: "#9ca3af", marginTop: 2 },
  fileSize: { fontSize: 10, color: "#6b7280", marginTop: 2 },
  submitButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: { opacity: 0.6, shadowOpacity: 0 },
  submitGradient: {
    flexDirection: "row",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitIcon: { marginRight: 4 },
  submitText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  bottomSpacer: { height: 40 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalContentSmall: {
    backgroundColor: "#fff",
    borderRadius: 16,
    maxHeight: "50%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  modalSearchInput: {
    margin: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#f9fafb",
  },
  modalList: { maxHeight: 350 },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalItemActive: { backgroundColor: "#eff6ff" },
  modalItemLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  modalAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  modalAvatarText: { fontSize: 14, fontWeight: "700", color: "#6b7280" },
  modalItemName: { fontSize: 14, fontWeight: "500", color: "#374151" },
  modalItemEmail: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  modalEmpty: {
    textAlign: "center",
    color: "#9ca3af",
    paddingVertical: 20,
    fontSize: 13,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    maxHeight: "80%",
    overflow: "hidden",
    flexDirection: "column",
  },
  datePickerModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: "auto",
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  datePickerCancelText: {
    fontSize: 16,
    color: "#9ca3af",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  datePickerConfirmText: {
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inputDisabled: {
    backgroundColor: "#f3f4f6",
    opacity: 0.6,
  },
  clearTimeSlotButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingVertical: 4,
  },
  clearTimeSlotText: {
    fontSize: 12,
    color: "#6b7280",
    textDecorationLine: "underline",
  },
  timeSlotWarning: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fffbeb",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#f59e0b",
  },
  timeSlotWarningText: {
    flex: 1,
    fontSize: 12,
    color: "#92400e",
    lineHeight: 18,
  },
  availableModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  availableModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    minHeight: "60%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  availableModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  availableModalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  availableModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  availableModalCloseBtn: {
    position: "absolute",
    right: 16,
    top: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  availableModalSearchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  availableModalSearchInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  availableModalSearchField: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  availableModalInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  availableModalCount: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  availableModalSelectAll: {
    fontSize: 13,
    color: "#2563eb",
    fontWeight: "600",
  },
  availableModalList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  availableModalEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  availableModalEmptyText: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  availableModalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#fafbfc",
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  availableModalItemActive: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  availableModalItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  availableModalCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
  },
  availableModalCheckboxActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  availableModalItemName: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
  },
  availableModalItemNameActive: {
    color: "#1e40af",
    fontWeight: "600",
  },
  availableModalQty: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 4,
    gap: 4,
  },
  availableModalQtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  availableModalQtyText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    minWidth: 32,
    textAlign: "center",
  },
  availableModalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    backgroundColor: "#fff",
  },
  availableModalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  availableModalCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6b7280",
  },
  availableModalConfirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  availableModalConfirmBtnDisabled: {
    backgroundColor: "#93c5fd",
    shadowOpacity: 0,
    elevation: 0,
  },
  availableModalConfirmText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  phoneSelectContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  phoneSelectLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 8,
  },
  phoneSelectList: {
    gap: 6,
  },
  phoneSelectItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  phoneSelectItemActive: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  phoneSelectText: {
    flex: 1,
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  phoneSelectTextActive: {
    color: "#2563eb",
    fontWeight: "600",
  },
});

export const buildPdfDoc = (order: any, attachments: any[]) => {
  const printedAt = new Date().toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      PENDING: "Chờ tiếp nhận",
      ASSIGNED: "Đã điều phối",
      PROCESSING: "Đang thực hiện",
      COMPLETED: "Đã xong",
      FINISHED: "Hoàn tất",
      REJECTED: "Đã từ chối",
      SUPPLEMENT_REQUIRED: "Cần bổ sung",
      INCOMPLETE: "Chưa hoàn thành",
      RETURNED_CUSTOMER: "Hoàn đơn (Khách hàng)",
      RETURNED_PERSONAL: "Hoàn đơn (Cá nhân)",
    };
    return map[status] || status;
  };

  const getOrderTypeLabel = (type: string) => {
    return type === "DELIVERY" ? "Giao hồ sơ" : "Nhận hồ sơ";
  };

  const attachmentTable = [
    [
      { text: "STT", style: "th", alignment: "center" },
      { text: "Tên hồ sơ", style: "th", alignment: "center" },
      { text: "Số lượng", style: "th", alignment: "center" },
      { text: "Ghi nhận", style: "th", alignment: "center" },
    ],
    ...attachments.map((a, i) => [
      { text: i + 1, alignment: "center" },
      { text: a.name },
      { text: a.qty, alignment: "center" },
      {
        canvas: [
          {
            type: "rect",
            x: 0,
            y: 0,
            w: 12,
            h: 12,
            lineWidth: 1,
          },
        ],
        alignment: "center",
      },
    ]),
  ];

  return {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 40],
    defaultStyle: {
      font: "Roboto",
    },
    content: [
      // HEADER
      {
        columns: [
          [
            { text: "PHIẾU GIAO NHẬN HỒ SƠ", style: "title" },
            {
              text: `Mã đơn: ${order.orderCode || order.id}`,
              style: "sub",
            },
          ],
          [
            {
              text: `Loại yêu cầu: ${getOrderTypeLabel(order.orderType)}`,
              alignment: "right",
              style: "sub",
            },
            {
              text: `Trạng thái: ${statusLabel(order.status)}`,
              alignment: "right",
              style: "sub",
            },
            {
              text: `Ngày tạo: ${printedAt}`,
              alignment: "right",
              style: "sub",
            },
          ],
        ],
      },

      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 5,
            x2: 515,
            y2: 5,
            lineWidth: 0.5,
          },
        ],
        margin: [0, 10, 0, 10],
      },

      // CUSTOMER
      { text: "Thông tin khách hàng", style: "section" },

      {
        table: {
          widths: [180, "*"],
          body: [
            ["Tên công ty / Khách hàng", order.company || "-"],
            ["Người liên hệ", order.contact || "-"],
            ["Số điện thoại", order.phone || "-"],
            ["Địa chỉ làm việc", order.address || "-"],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          paddingLeft: () => 6,
          paddingRight: () => 6,
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
      },

      { text: "\n" },

      // ATTACHMENTS
      { text: "Danh sách hồ sơ", style: "section" },

      {
        table: {
          headerRows: 1,
          widths: [40, "*", 60, 80],
          body:
            attachments.length > 0
              ? attachmentTable
              : [
                  [
                    {
                      text: "Không có hồ sơ đính kèm",
                      colSpan: 4,
                      alignment: "center",
                      italics: true,
                      margin: [0, 10],
                    },
                    {},
                    {},
                    {},
                  ],
                ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          paddingLeft: () => 6,
          paddingRight: () => 6,
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
      },

      // FOOTER
      {
        text: "\nPhiếu được tạo từ hệ thống Nhị Gia Logistics",
        style: "footer",
      },
    ],

    styles: {
      title: {
        fontSize: 16,
        bold: true,
      },
      sub: {
        fontSize: 10,
        color: "#555",
      },
      section: {
        fontSize: 13,
        bold: true,
        margin: [0, 10, 0, 5],
      },
      th: {
        bold: true,
        fillColor: "#f3f4f6",
      },
      footer: {
        alignment: "center",
        italics: true,
        fontSize: 10,
        color: "#6b7280",
      },
    },
  };
};

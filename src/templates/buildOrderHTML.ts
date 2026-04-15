import { getOrderTypeLabel } from "../utils/statusOrder";

export const buildOrderHTML = (order: any, attachments: any[]) => {
  const formatDate = (d: any) => {
    const date = new Date(d);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  };

  const date = new Date(order.createdAt);

  const formatted = new Date(order.createdAt).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

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

  const getOrderTypeLabelHeader = (type: string) => {
    const map: Record<string, string> = {
      DELIVERY: "PHIẾU GIAO HỒ SƠ",
      PICKUP: "PHIẾU NHẬN HỒ SƠ",
    };
    return map[type] || type;
  };

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>

        body {
          font-family: Helvetica, Arial, sans-serif;
          background: #fff;
          color: #000;
          display: flex;
          justify-content: center;
          font-size: 14px;
          line-height: 1.4;
        }

        .page {
          width: 210mm;
          min-height: 297mm;
          padding: 32px;
          font-size: 14px;
          line-height: 1.5;
        }

        h1 {
          font-size: 20px;
          font-weight: 700;
          text-transform: uppercase;
          margin: 0;
        }

        h2 {
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .subtext {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }

        .right {
          text-align: right;
          font-size: 12px;
        }

        .divider {
          border-bottom: 1px solid #9ca3af;
          margin-bottom: 16px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          font-size: 13px;
          border: 1px solid #d1d5db;
        }

        thead {
          display: table-row-group;
        }

        th {
          padding: 8px;
          border-bottom: 1px solid #d1d5db;
          background: #f3f4f6;
          font-weight: 600;
        }

        td {
          padding: 8px;
          border-bottom: 1px solid #d1d5db;
        }

        tr:last-child td {
          border-bottom: none;
        }

        .label {
          font-weight: 600;
          width: 220px;
        }

        .center {
          text-align: center;
        }

        .top {
          vertical-align: top;
        }

        .note-box {
          border: 1px solid #d1d5db;
          padding: 12px;
          min-height: 60px;
          margin-bottom: 16px;
        }

        .checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid #000;
          margin: auto;
        }

        .empty {
          text-align: center;
          padding: 16px;
          color: #6b7280;
          font-style: italic;
        }

        .footer {
          margin-top: 32px;
          font-size: 12px;
          text-align: center;
          color: #6b7280;
          font-style: italic;
        }

      </style>
    </head>

    <body>
      <div class="page">

        <!-- HEADER -->
        <div class="header">
          <div>
            <h1>${getOrderTypeLabelHeader(order.orderType)}</h1>
            <div class="subtext">
              Mã đơn: ${order.orderCode || order.id}
            </div>
          </div>

          <div class="right">
            <div><b>Loại yêu cầu:</b> ${getOrderTypeLabel(order.orderType)}</div>
            <div><b>Trạng thái:</b> ${statusLabel(order.status)}</div>
            <div><b>Ngày tạo:</b> ${printedAt}</div>
          </div>
        </div>

        <div class="divider"></div>

        <!-- CUSTOMER -->
        <h2>Thông tin khách hàng</h2>

        <table>
          <tr>
            <td class="label">Tên công ty / Khách hàng</td>
            <td>${order.company || "-"}</td>
          </tr>
          <tr>
            <td class="label">Người liên hệ</td>
            <td>${order.contact || "-"}</td>
          </tr>
          <tr>
            <td class="label">Số điện thoại</td>
            <td>${order.phone || "-"}</td>
          </tr>
          <tr>
            <td class="label top">Địa chỉ làm việc</td>
            <td>${order.address || "-"}</td>
          </tr>
        </table>
        
        <!-- ATTACHMENTS -->
        <h2>Danh sách hồ sơ</h2>

        <table>
          <thead>
            <tr>
              <th class="center" style="width:40px">STT</th>
              <th class="center">Tên hồ sơ</th>
              <th class="center" style="width:80px">Số lượng</th>
              <th class="center" style="width:100px">Ghi nhận</th>
            </tr>
          </thead>

          <tbody>
            ${
              attachments.length
                ? attachments
                    .map(
                      (a, i) => `
                <tr>
                  <td class="center">${i + 1}</td>
                  <td>${a.name}</td>
                  <td class="center">${a.qty}</td>
                  <td class="center">
                    <div class="checkbox"></div>
                  </td>
                </tr>
              `,
                    )
                    .join("")
                : `
                <tr>
                  <td colspan="4" class="empty">
                    Không có hồ sơ đính kèm
                  </td>
                </tr>
              `
            }
          </tbody>
        </table>

        <!-- FOOTER -->
        <div class="footer">
          Phiếu được tạo từ hệ thống Nhị Gia Logistics
        </div>

      </div>
    </body>
  </html>
  `;
};

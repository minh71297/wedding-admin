// Nội dung mặc định. Dữ liệu từ trang admin sẽ ghi đè lên các giá trị này.
window.WEDDING_DEFAULTS = {
  couple: { groomName: "Quang Minh", brideName: "Ngọc Hân" },
  cover: { line1: "Trân trọng kính mời", guestDefault: "Bạn và người thương", line2: "tới dự lễ thành hôn của chúng mình" },
  hero: { title: "Chúng mình cưới rồi!", image: "" },
  weddingDate: "2026-12-20T11:00",
  invite: "Trân trọng kính mời bạn đến chung vui cùng gia đình chúng mình trong ngày trọng đại.",
  marquee: "Save the date 20.12.2026\nCảm ơn bạn đã đến chung vui\nDudu ♥ Bubu",
  groom: { fullName: "Nguyễn Quang Minh", photo: "", bio: "Hay cười, mê cà phê và rất sợ trễ hẹn.", father: "Nguyễn Văn An", mother: "Trần Thị Bình", address: "Cầu Giấy, Hà Nội", phone: "", zalo: "", facebook: "", helpers: [] },
  bride: { fullName: "Lê Ngọc Hân", photo: "", bio: "Thích nấu ăn, nuôi mèo và chụp ảnh.", father: "Lê Văn Cường", mother: "Phạm Thị Dung", address: "Đống Đa, Hà Nội", phone: "", zalo: "", facebook: "", helpers: [] },
  events: [
    { title: "Lễ Vu Quy", time: "2026-12-20T08:00", place: "Tư gia nhà gái", address: "Số 1 Phố Ví Dụ, Đống Đa, Hà Nội", mapLink: "", mapEmbed: "", image: "" },
    { title: "Tiệc Cưới", time: "2026-12-20T11:00", place: "Trung tâm tiệc cưới Hoa Hồng", address: "Số 2 Đường Ví Dụ, Cầu Giấy, Hà Nội", mapLink: "", mapEmbed: "", image: "" }
  ],
  schedule: [
    { time: "10:30", title: "Đón khách & chụp ảnh" },
    { time: "11:00", title: "Làm lễ thành hôn" },
    { time: "11:30", title: "Khai tiệc" },
    { time: "13:00", title: "Cảm ơn & tiễn khách" }
  ],
  dressCode: { text: "Mời bạn mặc tông pastel nhẹ nhàng để ảnh chung thật xinh nhé.", colors: "#F7C6D0, #FFE3A3, #CDE7D8, #FFFFFF" },
  story: [
    { date: "2019", title: "Lần đầu gặp nhau", content: "Một buổi chiều mưa ở quán cà phê quen.", image: "" },
    { date: "2023", title: "Lời cầu hôn", content: "Anh run đến mức làm rơi nhẫn hai lần.", image: "" }
  ],
  gift: {
    enabled: true,
    note: "Sự hiện diện của bạn là món quà ý nghĩa nhất. Nếu không thể đến, bạn có thể gửi lời chúc qua đây.",
    groom: { label: "Mừng cưới chú rể", bank: "", account: "", owner: "", qr: "" },
    bride: { label: "Mừng cưới cô dâu", bank: "", account: "", owner: "", qr: "" }
  },
  decor: {
    showHi: true,
    coverSticker: "", heroSticker: "", groomSticker: "", brideSticker: "", inviteSticker: "",
    countdownSticker: "", eventsSticker: "", scheduleSticker: "", dividerSticker: "", storySticker: "",
    albumSticker: "", rsvpSticker: "", wishesSticker: "", giftSticker: "", contactSticker: "",
    footerSticker: "", floatSticker: ""
  },
  music: { url: "", title: "", autoplay: false, shuffle: false, tracks: [] },
  rsvp: { enabled: true, deadline: "Vui lòng xác nhận trước ngày 10/12/2026" },
  thanks: "Cảm ơn bạn rất nhiều vì đã là một phần câu chuyện của chúng mình."
};

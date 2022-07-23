
let result = [];
let output = "";
const CONTROL = {
  // periodHour: 2,
  periodHour: 24,
  endTimeStamp: "",
};

const saveData = (function () {
  var a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  return function (data, fileName) {
    var blob = new Blob([data], { type: "octet/stream" });
    var url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  };
})();

const getData = function (sinceId, cb) {
  GM_xmlhttpRequest({
    url: `https://web-api.hstong.com/news/textlive/7x24/query-page?sinceId=${sinceId}&pageSize=20&tagTypeCode=0`,
    method: "GET",
    responseType: "json",
    onload(response) {
      if (response.status === 200) {
        const data = response.response;
        console.info("res", data.data);
        cb(data.data);
      }
    },
  });
};

// init
const init = function() {
  if (window.confirm("是否开始下载24小时以内的咨询")) {
    getData(0, function (res) {
      if (res.data.length) {
        result = result.concat(res.data);
        const lastItem = res.data[res.data.length - 1];
        const endTime = new Date();
        endTime.setTime(endTime.getTime() - 3600 * CONTROL.periodHour * 1000);
        CONTROL.endTimeStamp = endTime.getTime();

        // console.info("endTimeStamp", CONTROL.endTimeStamp);

        // 开始爬取
        getNextData(lastItem.commentId);
      }
    });
  }  
};
init();


const getNextData = function (sinceId) {
  getData(sinceId, function (res) {
    if (res.data.length) {
      result = result.concat(res.data);
      const lastItem = res.data[res.data.length - 1];

      console.info(
        "lastItem.createdDate",
        lastItem.createdDate,
        CONTROL.endTimeStamp
      );

      if (lastItem.createdDate > CONTROL.endTimeStamp) {
        setTimeout(() => {
          getNextData(lastItem.commentId);
        }, 100);
      } else {
        result.forEach((item, index) => {
          const d = new Date();
          d.setTime(item.createdDate);
          output += `#${index + 1}\t ${d.toLocaleDateString()} ${item.createdDateFmt}\t\t${item.content}\n\n`;
        });

        saveData(output, `${new Date().toLocaleDateString()}.txt`);
      }
    }
  });
};

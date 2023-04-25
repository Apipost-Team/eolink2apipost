class eolink2apipost {
  version: string;
  project: any;
  apis: any[];
  env: any[]
  constructor() {
    this.version = '1.0';
    this.project = {};
    this.apis = [];
    this.env = [];
  }
  ConvertResult(status: string, message: string, data: any = '') {
    return {
      status,
      message,
      data
    }
  }
  validate(json: any) {
    // if (json.hasOwnProperty('projectInfo')) {
    // if (json.version !== '1.0') {
    //   return this.ConvertResult('error', 'Must contain a eolink field 1.0');
    // } else {
    //   this.version = '2.0';
    // }
    // }
    if (!json.hasOwnProperty('projectInfo')) {
      return this.ConvertResult('error', 'Must contain a eolinkProject field');
    }

    return this.ConvertResult('success', '');
  }
  handleInfo(json: any) {
    this.project.name = json?.projectInfo?.projectName || '新建项目';
    this.project.description = json?.projectInfo?.projectDesc || '';
  }
  handleEnv(json: any) {
    if (json.hasOwnProperty('env') && json.env instanceof Array) {
      for (const i of json.env) {
        let newEnv: any = {
          name: i?.envName || '未命名环境',
          pre_url: i?.frontURI || '',
          type: 'custom',
          list: {},
        }
        if (i.hasOwnProperty('globalVariable')) {
          for (const parm of i.globalVariable) {
            if (parm.hasOwnProperty('paramKey') && parm.paramKey) {
              newEnv.list[parm.paramKey] = {
                current_value: parm?.paramValue || '',
                value: parm?.paramValue || '',
                description: parm?.paramName || '',
              };
            }
          }
        }
        this.env.push(newEnv);
      }
    }
  }
  createNewApi(item: any) {
    const { baseInfo } = item || {};
    var api: any = {
      name: baseInfo?.apiName || '新建接口',
      target_type: 'api',
      url: baseInfo?.apiURI || "",
      method: baseInfo.hasOwnProperty('apiRequestType') && baseInfo.apiRequestType == 1 ? 'GET' : 'POST',
      request: {
        'query': [],
        'header': [],
        'description': baseInfo?.apiNote || '',
      }
    }
    const { request } = api;
    if (item.hasOwnProperty('urlParam') && item.urlParam instanceof Array) {
      for (const i of item.urlParam) {
        i.paramKey && request.query.push({
          is_checked: '1',
          type: 'Text',
          key: i.paramKey,
          value: i.paramInfo || '',
          not_null: '1',
          description: i.desc || '',
          field_type: "Text"
        });
      }
    }
    if (item.hasOwnProperty('headerInfo') && item.headerInfo instanceof Array) {
      for (const i of item.headerInfo) {
        i.headerName && request.header.push({
          is_checked: '1',
          type: 'Text',
          key: i.headerName,
          value: i.headerValue || '',
          not_null: '1',
          description: i.desc || '',
          field_type: "Text"
        });
      }
    }
    if (baseInfo.hasOwnProperty('apiRequestParamType')) {
      request.body = {
        "mode": "none",
        "parameter": [],
        "raw": '',
        "raw_para": []
      }
      if (baseInfo.apiRequestParamType == 0) {
        request.body.mode = 'form-data';
        if (item.hasOwnProperty('requestInfo') && item.requestInfo instanceof Array) {
          item.requestInfo.forEach((param: any) => {
            param.paramKey && request.body.parameter.push(
              {
                is_checked: "1",
                type: param.hasOwnProperty('paramType') && param.paramType == '1' ? 'File' : 'Text',
                key: param.paramKey || "",
                value: param.paramInfo || "",
                not_null: "1",
                description: param.desc || "",
                field_type: "Text"
              }
            )
          })
        }
      } else if (baseInfo.apiRequestParamType == 1 && baseInfo.hasOwnProperty('apiRequestRaw')) {
        request.body.mode = 'json';
        request.body.raw = baseInfo.apiRequestRaw || '';
      }
    }
    return api;
  }
  createNewFolder(item: any) {
    var newFolder: any = {
      'name': item?.groupName || '新建目录',
      'target_type': 'folder',
      'description': item?.comment || '',
      'children': [],
    };
    return newFolder;
  }
  handleApiAndFolder(items: any[], parent: any = null) {
    var root = this;
    for (const item of items) {
      let target;
      if (item.hasOwnProperty('apiList') && item.hasOwnProperty('groupName')) {
        target = root.createNewFolder(item);
        // 存在子目录
        if (item.hasOwnProperty('apiGroupChildList') && Object.prototype.toString.call(item.apiGroupChildList) === '[object Array]') {
          root.handleApiAndFolder(item.apiGroupChildList, target);
        }
        // 处理接口数组
        root.handleApiAndFolder(item.apiList, target);
      } else {
        target = root.createNewApi(item);
      }
      if (parent && parent != null) {
        parent.children.push(target);
      } else {
        root.apis.push(target);
      }
    }
  }
  handleApiCollection(json: any) {
    if (json.hasOwnProperty('apiGroupList') || json.hasOwnProperty('apiList')) {
        let apiGroupList = json.apiGroupList || json.apiList;
           if (apiGroupList instanceof Array && apiGroupList.length > 0) {
               this.handleApiAndFolder(apiGroupList, null);
        }
    }

  }
  convert(json: object) {
    var validationResult = this.validate(json);
    if (validationResult.status === 'error') {
      return validationResult;
    }
    this.handleInfo(json);
    this.handleApiCollection(json);
    this.handleEnv(json);
    validationResult.data = {
      project: this.project,
      apis: this.apis
    }
    console.log('project', JSON.stringify(validationResult));
    return validationResult;
  }
}

export default eolink2apipost;

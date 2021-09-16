const valid = require("validator");
const fs = require("fs");
const path = require("path");

let config = require("rc")("ahoy", JSON.parse(fs.readFileSync(path.join(__dirname, "../config.json"))));


const LICENSE = [
  {
    "title": "No License",
    "value": "no-license"
  }, {
    "title": "Academic Free License v3.0",
    "value": "afl-3.0"
  },{
    "title": "Apache license 2.0",
    "value": "apache-2.0"
  }, {
    "title": "Artistic license 2.0",
    "value": "artistic-2.0"
  }, {
    "title": "Boost Software License 1.0",
    "value": "bsl-1.0"
  }, {
    "title": "BSD 2-clause Simplified license",
    "value": "bsd-2-clause"
  }, {
    "title": "BSD 3-clause New or Revised license",
    "value": "bsd-3-clause"
  }, {
    "title": "BSD 3-clause Clear license",
    "value": "bsd-3-clause-clear"
  }, {
    "title": "Creative Commons license family",
    "value": "cc"
  }, {
    "title": "Creative Commons Zero v1.0 Universal",
    "value": "cc0-1.0"
  }, {
    "title": "Creative Commons Attribution 4.0",
    "value": "cc-by-4.0"
  }, {
    "title": "Creative Commons Attribution Share Alike 4.0",
    "value": "cc-by-sa-4.0"
  },{
    "title": "Do What The F*ck You Want To Public License",
    "value": "wtfpl"
  }, {
    "title": "Educational Community License v2.0",
    "value": "ecl-2.0"
  }, {
    "title": "Eclipse Public License 1.0",
    "value": "epl-1.0"
  }, {
    "title": "Eclipse Public License 2.0",
    "value": "epl-2.0"
  }, {
    "title": "European Union Public License 1.1",
    "value": "eupl-1.1"
  }, {
    "title": "GNU Affero General Public License v3.0",
    "value": "agpl-3.0"
  }, {
    "title": "GNU General Public License family",
    "value": "gpl"
  }, {
    "title": "GNU General Public License v2.0",
    "value": "gpl-2.0"
  }, {
    "title": "GNU General Public License v3.0",
    "value": "gpl-3.0"
  },{
    "title": "GNU Lesser General Public License family",
    "value": "lgpl"
  }, {
    "title": "GNU Lesser General Public License v2.1",
    "value": "lgpl-2.1"
  }, {
    "title": "GNU Lesser General Public License v3.0",
    "value": "lgpl-3.0"
  }, {
    "title": "ISC",
    "value": "isc"
  }, {
    "title": "LaTeX Project Public License v1.3c",
    "value": "lppl-1.3c"
  }, {
    "title": "Microsoft Public License",
    "value": "ms-pl"
  }, {
    "title": "MIT", "value": "mit"
  }, {
    "title": "Mozilla Public License 2.0",
    "value": "mpl-2.0"
  }, {
    "title": "Open Software License 3.0",
    "value": "osl-3.0"
  }, {
    "title": "PostgreSQL License",
    "value": "postgresql"
  }, {
    "title": "SIL Open Font License 1.1",
    "value": "ofl-1.1"
  },{
    "title": "University of Illinois/NCSA Open Source License",
    "value": "ncsa"
  }, {
    "title": "The Unlicense",
    "value": "unlicense"
  }, {
    "title": "zLib License",
    "value": "zlib"
  }
];

const VALIDATION = {
  "color": color => valid.isHexColor(color) === true ? true : `Invalid Hex Color`,
  "email": email => valid.isEmail(email) === true ?  true : `Invalid Email`,
  "url": url => valid.isURL(url) === true ?  true : `Invalid URL`,
  "tel": phone => valid.isMobilePhone(phone.replace(/[()-\s]/g, "")) === true ?  true : `Invalid Phone Number`,
  "slug": slug => valid.isSlug(slug) === true ? true : `Only Alphanumeric, dashes, and underscores allowed`
}

const RESERVED_FIELD_NAMES = [
  "skeleton_name", "skeleton_description", "skeleton_author", "skeleton_keywords",
  "skeleton_version", "skeleton_license", "skeleton_repository"
]

const DEFAULT_QUESTIONS = [
  {
    "type": "text",
    "name": "skeleton_name",
    "message": "Project Name",
    "validate": VALIDATION.slug
  }, {
    "type": "text",
    "name": "skeleton_description",
    "message": "Project Description",
    "required": false
  }, {
    "type": "text",
    "name": "skeleton_author",
    "message": "Project Author",
    "initial": config.author,
    "required": false
  }, {
    "type": "list",
    "name": "skeleton_keywords",
    "message": "Project Keywords",
    "required": false
  }, {
    "type": "text",
    "name": "skeleton_version",
    "message": "Project Version",
    "initial": config.version,
    "required": false
  },
  {
    "type": "select",
    "name": "skeleton_license",
    "message": "Project License",
    "choices": LICENSE,
    "initial": LICENSE.findIndex((element, index) => element.value === config.license ? true : false),
    "required": false
  }, {
    "type": "text",
    "name": "skeleton_repository",
    "message": "Project Repository",
    "choices": [],
    "required": false
  }
];

// Possible field types. These are representative of the possible HTML fields,
// translated to the possible terminal fields
const QUESTION_TYPE = {
  "checkbox": "confirm",
  "color": "text",
  "date": "date",
  "datetime-local": "date",
  "email": "text",
  "month": "date",
  "number": "number",
  "password": "password",
  "radio": "select",
  "range": "number",
  "select": "select",
  "multi-select": "multiselect",
  "tel": "text",
  "text": "text",
  "time": "date",
  "url": "text",
  "week": "date",
  "auto": "text"
}

// Additional terminal fields that can be used when supplying the widget param.
const WIDGETS = [
  "toggle",
  "list",
  "autocomplete",
  "slug"
];

const MASK = {
  "week": "dddd",
  "time": "hh:mm:ss a",
  "month": "MMMM",
  "date": "YYYY-MM-DD",
  "datetime-local": "YYYY-MM-DD hh:mm:ss a",
}


module.exports = {
  RESERVED_FIELD_NAMES,
  DEFAULT_QUESTIONS,
  QUESTION_TYPE,
  VALIDATION,
  WIDGETS,
  LICENSE,
  MASK,
}

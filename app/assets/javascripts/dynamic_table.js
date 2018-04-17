/*
  DynamicTable uses turbograft to update just parts of the page based on how it
  is configured via an options hash.

  Options Hash Description:

    base_path - the base path of the url to append params to
    filters - the filters used to filter to contents of the table
      key - the name of the filter
      value - the default value of the filter
    inputs - the page inputs that change the filters
      key - the name of the input on the page (it's id)
      value - the type of input (text_field, select, sort_link)
    replaceable_parts - the parts on the page to be replaced on a refresh
 */

var dynamic_table_new_location = location.search;

function DynamicTable(options) {
  this.options = options;

  this.getUrlParams = function(name) {
    var search_location;

    console.log("getUrlParams name: " + name)

    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(dynamic_table_new_location);
    if (results != undefined) {
      results = results[1];
    }
    console.log("getUrlParams result: " + results)
    return results;
  }

  this.refresh = function() {
    console.log("going to url: " + this.url());
    Page.refresh({url: this.url(), onlyKeys: this.options.refreshables})
  }

  this.url = function() {
    var queries = [];
    for (filter in this.options.filters) {
      var param_value = this.new_values[filter];
      if (param_value != this.options.filters[filter]) {
        queries.push(filter + "=" + encodeURIComponent(param_value))
      }
    }

    var joinChar = this.joinCharForUrl(this.options.base_path);
    dynamic_table_new_location = joinChar + queries.join("&")
    console.log("setting dynamic_table_new_location = " + dynamic_table_new_location);
    return this.options.base_path + ((queries.length > 0) ? dynamic_table_new_location : "")
  }

  this.joinCharForUrl = function(url) {
    var regex = new RegExp("\\\?");
    if (regex.exec(url) == undefined) {
      return "?";
    }
    else {
      return "&";
    }
  }

  this.setNewValues = function() {
    this.new_values = {};
    console.log(this.options.filters)
    for (filter in this.options.filters) {
      var param_value = this.getUrlParams(filter);
      if (param_value == undefined) {
        console.log("param_value is undefined for: " + filter)
        param_value = this.options.filters[filter];
      }
      this.new_values[filter] = param_value;
      console.log("new_values[" + filter + "] = " + param_value)
    }
  }

  this.registerTextField = function(self, input_name) {
    $("#" + input_name).keyup(function (event) {
      self.new_values[input_name] = event.target.value;
      self.refresh();
    })
  }

  this.registerSelectField = function(self, input_name) {
    $("#" + input_name).change(function (event) {
      self.new_values[input_name] = event.target.value;
      self.refresh();
    })
  }

  this.registerLinkField = function(self, input_name) {
    $("#" + input_name).click(function (event) {
      event.preventDefault();
      console.log("link clicked: " + input_name)
      if (self.new_values.sort_by == input_name) {
        if (self.new_values.sort_dir == "asc") {
          self.new_values.sort_dir = 'desc';
        }
        else {
          self.new_values.sort_dir = 'asc';
        }
      }
      else {
        self.new_values.sort_by = input_name;
        self.new_values.sort_dir = 'asc';
      }
      self.refresh();
      return false;
    })
  }

  this.initialize = function() {
    console.log("-- DynamicTable: options -------------")
    console.log(options);
    console.log("--------------------------------------")
    var self = this;
    this.setNewValues();
    for(var input in options.inputs) {
      var input_type = options.inputs[input]
      // console.log("input, input = " + input);
      if (input_type == 'text_field') {
        self.registerTextField(self, input);
      }
      else if (input_type == "select") {
        self.registerSelectField(self, input)
      }
      else if (input_type == "sort_link") {
        console.log("link input, input = " + input);
        self.registerLinkField(self, input)
      }
    }
  }
}
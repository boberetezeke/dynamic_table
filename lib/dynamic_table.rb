require_relative 'dynamic_table/engine'

module DynamicTable
  class Table
    def initialize(view:, base_path:, params:, filters: {})
      @view = view
      @base_path = base_path
      @params = params
      @filters = filters
      @inputs = {}
      @refreshables = []
    end

    def generate(&block)
      @view.capture(self, &block) + script_tag
    end

    def text_field_tag(name, options={})
      options = HashWithIndifferentAccess.new(options)
      input = {field_type: :text_field, update_on: :keyup}
      input[:update_on] = options.delete(:update_on) if options[:update_on]
      @inputs[name] = input
      @view.text_field_tag(name, @params[name], options)
    end

    def select_tag_options_for_select(name, hash)
      @inputs[name] = {field_type: :select}
      hash = hash.call if hash.is_a?(Proc)
      @view.select_tag(name, @view.options_for_select(hash, @params[name] || @filters[name]))
    end

    def check_box_tag(name)
      @inputs[name] = {field_type: :check_box}
      @view.check_box_tag(name, "checked", (@params[name] == "true"))
    end

    def sort_link_to(title, name)
      @inputs[name] = {field_type: :sort_link}
      @view.link_to(title, "#", id: "#{name}_sort_link")
    end

    def refreshable(name)
      @refreshables.push(name)
      { "id" => name, "data-tg-refresh" => name}
    end

    def script_tag
      ("<script>" +
        "$(function() { (new DynamicTable(" + dynamic_table_options.to_json + ")).initialize() });" +
      "</script>").html_safe
    end

    def dynamic_table_options
      {
          inputs:       @inputs,
          refreshables: @refreshables,
          base_path:    @base_path,
          filters:      @filters
      }
    end
  end
end

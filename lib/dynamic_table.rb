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

    def text_field_tag(name, *args)
      @inputs[name] = :text_field
      @view.text_field_tag(name, @params[name], *args)
    end

    def select_tag_options_for_select(name, hash)
      @inputs[name] = :select
      @view.select_tag(name, @view.options_for_select(hash, @params[name] || @filters[name]))
    end

    def sort_link_to(title, name)
      @inputs[name] = :sort_link
      @view.link_to(title, "#", id: name)
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

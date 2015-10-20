
module.exports = {
    TEXT: function() {
        return {
            sqlType: "TEXT"
        };
    },
    DATETIME: function(opt) {
        var type = "timestamp";
        if (opt && opt.tz) {
            type += " with time zone";
        }
        return {
            sqlType: type
        };
    },
    ARRAY: function(type) {
        return {
            sqlType: type.sqlType + " ARRAY"
        };
    },
    ID: function() {
        return {
            sqlType: "CHAR(24)"
        };
    },
    DECIMAL: function() {
        return {
            sqlType: "DECIMAL"
        };
    },
    JSON: function() {
        return {
            sqlType: "JSON"
        };
    }
};

/**
 * 用于搜索的input，带图标
 * param:
 *      placeholder
 *      onSearch
 *      onInputChange
 *      className
 * added by hzh
 */
var React = require('react');
var Icon = require('antd').Icon;
var Button = require('antd').Button;
var Input = require('antd').Input;

const InputGroup = Input.Group;
const SearchInput = React.createClass({
    getDefaultProps: function () {
        return {
            value: ''
        }
    },
    getInitialState() {
        return {
            value: '',
            focus: false
        };
    },
    handleInputChange(e) {
        var newValue = e.target.value;
        this.props.onInputChange && this.props.onInputChange(newValue);
        this.setState({
            value: newValue
        });
    },
    handleFocusBlur(e) {
        this.setState({
            focus: e.target === document.activeElement
        });
    },
    handleSearch() {
        if (this.state.value === '') {
            return;
        }
        if (this.props.onSearch) {
            this.props.onSearch(this.state.value);
        }
    },
    render() {
        return (
            <InputGroup className={this.props.className+' '+'ant-search-input ant-search-input-focus'}>
                <Input placeholder={this.props.placeholder}
                       defaultValue={this.props.value}
                       onChange={this.handleInputChange}
                       onKeyUp={this.handleSearch}
                       onFocus={this.handleFocusBlur}
                       onBlur={this.handleFocusBlur}/>

                <div className="ant-input-group-wrap">
                    <Button className='ant-search-btn'
                            onClick={this.handleSearch}>
                        <Icon type="search"/>
                    </Button>
                </div>
            </InputGroup>
        );
    }
});

module.exports = SearchInput;
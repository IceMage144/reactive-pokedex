import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import $ from 'jquery';

const PKM_PER_PAGE = 20;

function getJSON(url) {
    return ($.ajax({
        type: 'GET',
        url: url,
        async: false,
        dataType: 'json',
        fail: function( jqXHR, textStatus, errorThrown ) {
            console.log( 'Could not get posts, server response: ' + textStatus + ': ' + errorThrown );
        }
    })).responseJSON;
}

class Pokedex extends React.Component {
    constructor(props) {
        super(props);
        let result = getJSON(`https://pokeapi.co/api/v2/pokemon/?limit=${PKM_PER_PAGE}&offset=0`);
        let list = [];
        for (const pkm of result.results)
            list.push(pkm.name);
        this.state = {
            offset: 0,
            pokemon: 0,
            pkmList: list,
            pkmShow: (<div></div>),
            nextDisabled: false,
            prevDisabled: true
        };
        this.pkmMax = result.count;
    }
    showPokemon(i) {
        this.setState({
            offset: this.state.offset,
            pokemon: this.state.offset + i + 1
        });
    }
    renderPokemon() {
        let result = {name: ""};
        if (this.state.pokemon !== 0)
            result = getJSON(`https://pokeapi.co/api/v2/pokemon/${this.state.pokemon}/`);
        return (<div><h1>{result.name}</h1></div>);
    }
    changeList(add) {
        let nextOffset = this.state.offset + add*20;
        let result = getJSON(`https://pokeapi.co/api/v2/pokemon/?limit=${PKM_PER_PAGE}&offset=${nextOffset}`);
        let list = [];
        for (const pkm of result.results)
            list.push(pkm.name);
        this.setState({
            pkmList: list,
            offset: nextOffset,
            nextDisabled: (nextOffset + 20 >= this.pkmMax),
            prevDisabled: (nextOffset - 20 < 0)
        });
        console.log(nextOffset);
    }
    renderButton(i) {
        return (
            <li key={i}>
                <button onClick={() => this.showPokemon(i)}>{this.state.pkmList[i]}</button>
            </li>
        );
    }
    render() {
        let list = []
        for (let i = 0; i < PKM_PER_PAGE; i++)
            list.push(this.renderButton(i));
        return (
            <div>
                <ul>
                    {list}
                </ul>
                <button onClick={() => this.changeList(1)} disabled={this.state.nextDisabled}>Next</button>
                <button onClick={() => this.changeList(-1)} disabled={this.state.prevDisabled}>Prev</button>
                <div>{this.renderPokemon()}</div>
            </div>);
    }
}

ReactDOM.render(
    <Pokedex />,
    document.getElementById('pokedex')
);

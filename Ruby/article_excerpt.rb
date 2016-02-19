class Article < ActiveRecord::Base
  # Retrieves HTML content stored in the database as <#Article>.content
  # and turns it into a plain-text content excerpt
  def content_excerpt(starting_length = 300, read_more_text = '... Read More')
    # Define HTML tags that need to be removed entirely
    remove_tags = ['code', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'iframe', 'noscript', 'ol', 'script', 'table', 'ul']
    # Clone the article's content
    content = self.content.clone
    # Get rid of all line break characters
    content.gsub!(/(\r|\n)/, '')
    # Rip out the full removal tags
    remove_tags.each do |tag|
      content.gsub!(/<#{tag}[^>]*>.*?<\/#{tag}>/, '')
    end
    # Now, expose plain text content by removing HTML tags, but not the content between them
    content.gsub!(/<[^>]+>/, '')
    char_count = (content.length >= (starting_length + 1) ? starting_length : content.length)
    if char_count >= starting_length
      while (content[char_count] != ' ' && char_count < content.length)
        char_count = char_count.next
      end
      return content[0..char_count] << "<a href=\"/article/#{self.url}\">#{read_more_text}</a>"
    else
      return content
    end
  end
end

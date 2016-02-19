def gather_file_listings(path)
  listings = Dir.entries(path)
  listings.delete_if {|x| x.match(/^\.+$/)}
  listings.each do |l|
    full_path = "#{path}/#{l}"
    # puts "#{path}/#{l}"
    if File.file?(full_path)
      $listings << full_path
      $listing_filenames << l
    elsif File.directory?(full_path)
      gather_file_listings(full_path)
    end
  end
end
